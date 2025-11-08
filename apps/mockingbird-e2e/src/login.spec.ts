import { test, expect, Page } from '@playwright/test';
import {
  performCreateTestUser,
  performDeleteTestUser,
  performSignIn,
  performSignOut,
} from './utils';
import { cleanupTestUsers } from './supabase-helpers';

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

    await expect(
      page.getByText('There was an authentication error:')
    ).toBeVisible();

    await page.getByRole('link', { name: 'Sign in' }).click();
  });

  test('create new user', async ({ page }) => {
    await performCreateTestUser(page);

    await expect(
      page.getByRole('button', { name: "What's going on, Testy?" })
    ).toBeVisible();

    await performSignOut(page);
    await expect(getSignInHeading(page)).toBeVisible();
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

  // OAuth tests are skipped in local environment
  // OAuth requires external services not available in E2E local setup
  test.skip('OAuth signin with GitHub', async ({ page }) => {
    // This test would require GitHub OAuth configuration
    // Skip in local E2E tests with Supabase
  });

  test.skip('OAuth signin with Google', async ({ page }) => {
    // This test would require Google OAuth configuration
    // Skip in local E2E tests with Supabase
  });
});
