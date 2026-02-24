import { expect, test } from '@playwright/test';
import {
  expireTestUserPassword,
  getTestResetToken,
  performDeleteTestUser,
  performSignOut,
} from './utils';

const BASE_URL = 'http://localhost:3000';

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

async function signInAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('user@example.com').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('password management', () => {
  test.describe.configure({ mode: 'serial' });

  // Track current password to allow tests to chain
  let currentPassword = pwTestPassword;

  test.beforeAll(async () => {
    // Ensure a fresh test user exists
    await createPwTestUser(pwTestPassword);
    currentPassword = pwTestPassword;
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signInAs(page, pwTestEmail, currentPassword);
    await performDeleteTestUser(page);
    await page.close();
  });

  test('forgot password - request reset email', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/forgot-password`);
    await page.getByPlaceholder('user@example.com').fill(pwTestEmail);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    await expect(
      page.getByText('If that email exists, a reset link was sent.')
    ).toBeVisible();
  });

  test('reset password via token', async ({ page }) => {
    // Request a new reset
    await page.goto(`${BASE_URL}/auth/forgot-password`);
    await page.getByPlaceholder('user@example.com').fill(pwTestEmail);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    await page.getByText('If that email exists, a reset link was sent.').waitFor();

    const token = await getTestResetToken(pwTestEmail);
    await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`);

    await page.getByPlaceholder('New password').fill(pwTestNewPassword);
    await page.getByPlaceholder('Confirm new password').fill(pwTestNewPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();

    // Should sign in and redirect to home
    await page.waitForURL(`${BASE_URL}/`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
    currentPassword = pwTestNewPassword;

    // Sign out for subsequent tests
    await performSignOut(page);
  });

  test('reset token is single-use', async ({ page }) => {
    // Request reset and get token
    await page.goto(`${BASE_URL}/auth/forgot-password`);
    await page.getByPlaceholder('user@example.com').fill(pwTestEmail);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    await page.getByText('If that email exists, a reset link was sent.').waitFor();

    const token = await getTestResetToken(pwTestEmail);

    // Use the token once (success)
    await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`);
    // Reset back to original password so suite stays in sync
    await page.getByPlaceholder('New password').fill(pwTestPassword);
    await page.getByPlaceholder('Confirm new password').fill(pwTestPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await page.waitForURL(`${BASE_URL}/`);
    currentPassword = pwTestPassword;

    await performSignOut(page);

    // Try the same token again
    await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`);
    await page.getByPlaceholder('New password').fill('SomePass789');
    await page.getByPlaceholder('Confirm new password').fill('SomePass789');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(
      page.getByText(/invalid or expired/i)
    ).toBeVisible();
  });

  test('reset token expires after 24 hours', async ({ page }) => {
    // Request reset
    await page.goto(`${BASE_URL}/auth/forgot-password`);
    await page.getByPlaceholder('user@example.com').fill(pwTestEmail);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    await page.getByText('If that email exists, a reset link was sent.').waitFor();

    // Force-expire the token
    const token = await getTestResetToken(pwTestEmail, { forceExpire: true });

    await page.goto(`${BASE_URL}/auth/reset-password?token=${token}`);
    await page.getByPlaceholder('New password').fill('SomePass789');
    await page.getByPlaceholder('Confirm new password').fill('SomePass789');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(
      page.getByText(/invalid or expired/i)
    ).toBeVisible();
  });

  test('expired password is detected at login', async ({ page }) => {
    await expireTestUserPassword(pwTestEmail);

    await page.goto(`${BASE_URL}/auth/signin`);
    await page.getByPlaceholder('user@example.com').fill(pwTestEmail);
    await page.getByPlaceholder('Password').fill(currentPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL(/expired-password/);
    await expect(
      page.getByText('Your password has expired and must be changed')
    ).toBeVisible();
  });

  test('expired password can be changed', async ({ page }) => {
    await page.goto(
      `${BASE_URL}/auth/expired-password?email=${encodeURIComponent(pwTestEmail)}`
    );

    const changedPassword = 'Changed789';
    await page.getByPlaceholder('Current password').fill(currentPassword);
    await page.getByPlaceholder('New password').fill(changedPassword);
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

    await page.goto(`${BASE_URL}/profile/change-password`);

    const changedPassword = 'Profile789';
    await page.getByPlaceholder('Current password').fill(currentPassword);
    await page.getByPlaceholder('New password').fill(changedPassword);
    await page.getByPlaceholder('Confirm new password').fill(changedPassword);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(
      page.getByText('Password changed successfully')
    ).toBeVisible();

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
    await page.waitForURL(`${BASE_URL}/`);
    await page.goto(`${BASE_URL}/profile/change-password`);

    await page.getByPlaceholder('Current password').fill('WrongPass000');
    await page.getByPlaceholder('New password').fill('NewPass999');
    await page.getByPlaceholder('Confirm new password').fill('NewPass999');
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(
      page.getByText(/current password is incorrect/i)
    ).toBeVisible();
  });

  test('change password - same password rejected', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/change-password`);

    await page.getByPlaceholder('Current password').fill(currentPassword);
    await page.getByPlaceholder('New password').fill(currentPassword);
    await page.getByPlaceholder('Confirm new password').fill(currentPassword);
    await page.getByRole('button', { name: 'Change Password' }).click();

    await expect(
      page.getByText(/must be different/i)
    ).toBeVisible();
  });
});
