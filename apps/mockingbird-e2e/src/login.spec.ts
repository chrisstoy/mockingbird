import { expect, Page, test } from '@playwright/test';
import { cleanupTestUsers } from './supabase-helpers';
import {
  performCreateTestUser,
  performDeleteTestUser,
  performSignIn,
} from './utils';

function getSignInHeading(page: Page) {
  return page.getByRole('heading', { name: 'Sign In', exact: true });
}

test.describe('Login and Account Creation', () => {
  test.describe.configure({ mode: 'serial' });

  // Cleanup any leftover test users from failed runs
  test.afterAll(async () => {
    await cleanupTestUsers();
  });
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('start at login page', async ({ page }) => {
    await expect(getSignInHeading(page)).toBeVisible();
  });

  test('login with invalid user', async ({ page }) => {
    await performSignIn(page);

    await expect(page.getByText('Invalid login credentials')).toBeVisible();
  });

  test('create new user', async ({ page }) => {
    await performCreateTestUser(page);

    await expect(page.getByRole('heading', { name: 'Success!' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(
      page.getByRole('button', { name: "What's going on, Testy?" })
    ).toBeVisible();
  });

  test('delete user', async ({ page }) => {
    await performSignIn(page);
    await performDeleteTestUser(page);
    await expect(getSignInHeading(page)).toBeVisible();

    // ensure user was deleted
    await performSignIn(page);
    await expect(
      page.getByText('There was an authentication error:')
    ).toBeVisible();
  });
});
