import { expect, Page, test } from '@playwright/test';
import {
  forceDeleteTestUser,
  performCreateTestUser,
  performSignInTestUser,
  performSignOut,
} from './utils';

function getSignInHeading(page: Page) {
  return page.getByRole('heading', { name: 'Sign In', exact: true });
}

test.describe('Login and Account Creation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await forceDeleteTestUser();
  });

  test.afterAll(async () => {
    await forceDeleteTestUser();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('start at login page', async ({ page }) => {
    await expect(getSignInHeading(page)).toBeVisible();
  });

  test('login with invalid user', async ({ page }) => {
    await performSignInTestUser(page);

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('create new user', async ({ page }) => {
    await performCreateTestUser(page);

    await expect(
      page.getByRole('button', { name: "What's going on, Testy?" })
    ).toBeVisible();

    await performSignOut(page);
    await expect(getSignInHeading(page)).toBeVisible();
  });
});
