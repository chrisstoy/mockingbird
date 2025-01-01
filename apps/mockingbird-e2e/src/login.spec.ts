import { test, expect, Page } from '@playwright/test';

const testUserEmail = 'testy.mctestface@example.com';
const testUserPassword = 'Starts123';

test.describe.configure({ mode: 'serial' });

test.describe('Basic Test', () => {
  let page: Page;
  // test.beforeAll(async ({ browser }) => {
  //   page = await browser.newPage();
  // });

  // test.afterAll(async () => {
  //   await page?.close();
  // });

  // replace beforeAll and afterAll with this for debugging tests
  test.beforeEach(async ({ page: _page }) => {
    page = _page;
    await page.goto('http://localhost:3000');
  });

  test('start at login page', async () => {
    // await page.goto('http://localhost:3000');
    await expect(page.getByText('Welcome to Mockingbird')).toBeVisible();
  });

  test('login with invalid user', async () => {
    await page.getByPlaceholder('user@example.com').fill(testUserEmail);
    await page.getByPlaceholder('Password').fill(testUserPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Sign In Error: Configuration')).toBeVisible();
  });

  test('create new user', async () => {
    await page.getByPlaceholder('user@example.com').fill(testUserEmail);
    await page.getByPlaceholder('Password').fill(testUserPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Sign In Error: Configuration')).toBeVisible();
  });

  test('delete user', async () => {
    await page.getByPlaceholder('user@example.com').fill(testUserEmail);
    await page.getByPlaceholder('Password').fill(testUserPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Sign In Error: Configuration')).toBeVisible();
  });
});
