import { expect, Page, test } from '@playwright/test';
import {
  BASE_URL,
  forceDeleteTestUser,
  forceVerifyTestUser,
  performCreateTestUser,
  performSignInTestUser,
  performSignOut,
  testUserEmail,
} from './utils';

function getSignInHeading(page: Page) {
  return page.getByRole('heading', { name: 'Sign In', exact: true });
}

test.describe('Login and Account Creation', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeAll(async () => {
    await forceDeleteTestUser();
  });

  test.afterAll(async () => {
    await forceDeleteTestUser();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('unauthenticated visit redirects to sign-in', async ({ page }) => {
    await expect(getSignInHeading(page)).toBeVisible();
  });

  test('sign-in with unknown email shows error', async ({ page }) => {
    await performSignInTestUser(page);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('create account redirects to TOS page', async ({ page }) => {
    await performCreateTestUser(page);
    await expect(
      page.getByRole('heading', { name: 'Terms of Service', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept Terms' })).toBeVisible();
  });

  test('accepting TOS redirects to verify-email page', async ({ page }) => {
    // Re-sign-in to get back to TOS (user exists but hasn't accepted yet)
    await performSignInTestUser(page);
    await page.getByRole('button', { name: 'Accept Terms' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Accept Terms' }).click();
    await expect(
      page.getByRole('heading', { name: 'Verify your email', exact: true })
    ).toBeVisible();
    await expect(page.getByText(testUserEmail)).toBeVisible();
  });

  test('sign-in while PENDING_EMAIL_VERIFICATION stays on verify-email', async ({
    page,
  }) => {
    await performSignInTestUser(page);
    await expect(
      page.getByRole('heading', { name: 'Verify your email', exact: true })
    ).toBeVisible();
  });

  test('after email verification, sign-in goes directly to home', async ({
    page,
  }) => {
    await forceVerifyTestUser();
    await performSignInTestUser(page);
    await expect(
      page.getByRole('button', { name: `What's on your mind, Testy?` })
    ).toBeVisible();
  });

  test('sign out returns to sign-in page', async ({ page }) => {
    await performSignInTestUser(page);
    await expect(
      page.getByRole('button', { name: `What's on your mind, Testy?` })
    ).toBeVisible();
    await performSignOut(page);
    await expect(getSignInHeading(page)).toBeVisible();
  });

  test('sign-in with wrong password shows error', async ({ page }) => {
    await page.getByPlaceholder('Email address').fill(testUserEmail);
    await page.getByPlaceholder('Password').fill('WrongPassword99');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });
});
