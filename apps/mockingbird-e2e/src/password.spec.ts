import { expect, test } from '@playwright/test';
import {
  BASE_URL,
  expireTestUserPassword,
  forceAcceptTOS,
  forceDeleteTestUser,
  forceVerifyTestUser,
  getTestResetToken,
  performSignOut,
} from './utils';

// Dedicated credentials for password tests to avoid conflicts with login.spec.ts
const pwTestEmail = 'pw.testy@example.com';
const pwTestName = 'Password Testy';
const pwTestPassword = 'Starts123';
const pwTestNewPassword = 'NewPass456';

async function createPwTestUser(password = pwTestPassword) {
  const { request: playwrightRequest } = await import('@playwright/test');
  const ctx = await playwrightRequest.newContext();
  // Create user via API
  const res = await ctx.post(`${BASE_URL}/api/users`, {
    data: {
      name: pwTestName,
      email: pwTestEmail,
      password,
      confirmPassword: password,
      turnstileToken: 'test',
    },
  });
  await ctx.dispose();
  return res;
}

/**
 * Waits for navigation to the home page, handling a possible TOS redirect.
 * The authorized callback enforces TOS acceptance before allowing access to any page,
 * so users who haven't accepted TOS are redirected to /auth/tos automatically.
 */
async function waitForHomeHandlingTOS(
  page: import('@playwright/test').Page
) {
  // Wait until we land on either home ('/') or the TOS page — not sign-in or intermediate pages
  await page.waitForURL((url) => url.pathname === '/' || url.pathname.startsWith('/auth/tos'), { timeout: 15000 });
  if (page.url().includes('/auth/tos')) {
    await page
      .getByRole('button', { name: 'Accept Terms' })
      .scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Accept Terms' }).click();
    await page.waitForURL(`${BASE_URL}/`);
  }
}

async function submitForgotPassword(
  page: import('@playwright/test').Page,
  email: string
) {
  await page.goto(`${BASE_URL}/auth/forgot-password`, { waitUntil: 'load' });
  // Retry submit up to 3 times — dev server may be recompiling on first hit
  for (let i = 0; i < 3; i++) {
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    const success = await page
      .getByText('If that email exists, a reset link was sent.')
      .waitFor({ timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (success) return;
    // Server may have been compiling — reload and retry
    await page.reload({ waitUntil: 'load' });
  }
  throw new Error('submitForgotPassword: success message never appeared');
}

async function signInAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  // Retry once in case a prior navigation is still in flight (ERR_ABORTED race)
  try {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'load' });
  } catch {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'load' });
  }
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await waitForHomeHandlingTOS(page);
}

test.describe('password management', () => {
  test.describe.configure({ mode: 'serial' });

  // Track current password to allow tests to chain
  let currentPassword = pwTestPassword;

  test.beforeAll(async () => {
    await forceDeleteTestUser(pwTestEmail);
    await createPwTestUser(pwTestPassword);
    // Accept TOS via API (triggers email verification internally)
    await forceAcceptTOS(pwTestEmail);
    // Force-verify email so user is ACTIVE
    await forceVerifyTestUser(pwTestEmail);
    currentPassword = pwTestPassword;
  });

  test.afterAll(async () => {
    await forceDeleteTestUser(pwTestEmail);
  });

  test('forgot password - request reset email', async ({ page }) => {
    await submitForgotPassword(page, pwTestEmail);
    await expect(
      page.getByText('If that email exists, a reset link was sent.')
    ).toBeVisible();
  });

  test('reset password via token', async ({ page }) => {
    await submitForgotPassword(page, pwTestEmail);

    const token = await getTestResetToken(pwTestEmail);
    await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`, { waitUntil: 'load' });

    await page.getByPlaceholder('New password', { exact: true }).fill(pwTestNewPassword);
    await page.getByPlaceholder('Confirm new password').fill(pwTestNewPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();

    // Should sign in and redirect to home (may pass through /auth/tos first)
    await waitForHomeHandlingTOS(page);
    await expect(page).toHaveURL(`${BASE_URL}/`);
    currentPassword = pwTestNewPassword;

    // Sign out for subsequent tests
    await performSignOut(page);
  });

  test('reset token is single-use', async ({ page }) => {
    await submitForgotPassword(page, pwTestEmail);

    const token = await getTestResetToken(pwTestEmail);

    // Use the token once (success)
    await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`, { waitUntil: 'load' });
    // Reset back to original password so suite stays in sync
    await page.getByPlaceholder('New password', { exact: true }).fill(pwTestPassword);
    await page.getByPlaceholder('Confirm new password').fill(pwTestPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    // May pass through /auth/tos before landing on home
    await waitForHomeHandlingTOS(page);
    currentPassword = pwTestPassword;

    await performSignOut(page);

    // Try the same token again (retry once — sign-out navigation may still be in flight)
    try {
      await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`, { waitUntil: 'load' });
    } catch {
      await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`, { waitUntil: 'load' });
    }
    await page.getByPlaceholder('New password', { exact: true }).fill('SomePass789');
    await page.getByPlaceholder('Confirm new password').fill('SomePass789');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText(/invalid or expired/i)).toBeVisible({ timeout: 10000 });
  });

  test('reset token expires after 24 hours', async ({ page }) => {
    await submitForgotPassword(page, pwTestEmail);

    // Force-expire the token
    const token = await getTestResetToken(pwTestEmail, { forceExpire: true });

    await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`, { waitUntil: 'load' });
    await page.getByPlaceholder('New password', { exact: true }).fill('SomePass789');
    await page.getByPlaceholder('Confirm new password').fill('SomePass789');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText(/invalid or expired/i)).toBeVisible({ timeout: 10000 });
  });

  test('expired password is detected at login', async ({ page }) => {
    await expireTestUserPassword(pwTestEmail);

    await page.goto(`${BASE_URL}/auth/signin`);
    await page.getByPlaceholder('Email address').fill(pwTestEmail);
    await page.getByPlaceholder('Password').fill(currentPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL(/expired-password/);
    await expect(
      page.getByText('Your password has expired and must be changed')
    ).toBeVisible();
  });

  test('expired password can be changed', async ({ page }) => {
    await page.goto(
      `${BASE_URL}/auth/expired-password?email=${encodeURIComponent(pwTestEmail)}`,
      { waitUntil: 'load' }
    );

    const changedPassword = 'Changed789';
    await page.getByPlaceholder('Current password').fill(currentPassword);
    await page.getByPlaceholder('New password', { exact: true }).fill(changedPassword);
    await page.getByPlaceholder('Confirm new password').fill(changedPassword);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await page.waitForURL(`${BASE_URL}/`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
    currentPassword = changedPassword;

    await performSignOut(page);
  });

  test('change password from profile', async ({ page }) => {
    await signInAs(page, pwTestEmail, currentPassword);
    // Wait for home page
    await page.waitForURL(`${BASE_URL}/`);

    await page.goto(`${BASE_URL}/profile/change-password`, { waitUntil: 'load' });

    const changedPassword = 'Profile789';
    await page.getByPlaceholder('Current password').fill(currentPassword);
    await page.getByPlaceholder('New password', { exact: true }).fill(changedPassword);
    await page.getByPlaceholder('Confirm new password').fill(changedPassword);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(page.getByText(/Password changed successfully/)).toBeVisible();

    // Should remain on the change-password page
    await expect(page).toHaveURL(/change-password/);
    currentPassword = changedPassword;

    // Sign out and back in with new password
    await performSignOut(page);
    await signInAs(page, pwTestEmail, currentPassword);
    await page.waitForURL(`${BASE_URL}/`);
    await performSignOut(page);
  });

  test('change password - wrong current password rejected', async ({
    page,
  }) => {
    await signInAs(page, pwTestEmail, currentPassword);
    await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'load' });
    await page.goto(`${BASE_URL}/profile/change-password`, { waitUntil: 'load' });

    await page.getByPlaceholder('Current password').fill('WrongPass000');
    await page.getByPlaceholder('New password', { exact: true }).fill('NewPass999');
    await page.getByPlaceholder('Confirm new password').fill('NewPass999');
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(
      page.getByText(/current password is incorrect/i)
    ).toBeVisible();

    await performSignOut(page);
  });

  test('change password - same password rejected', async ({ page }) => {
    await signInAs(page, pwTestEmail, currentPassword);
    await page.waitForURL(`${BASE_URL}/`);
    await page.goto(`${BASE_URL}/profile/change-password`, { waitUntil: 'load' });

    await page.getByPlaceholder('Current password').fill(currentPassword);
    await page.getByPlaceholder('New password', { exact: true }).fill(currentPassword);
    await page.getByPlaceholder('Confirm new password').fill(currentPassword);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(page.getByText(/must be different/i)).toBeVisible();
  });
});
