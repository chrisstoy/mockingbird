import { test, expect, Page } from '@playwright/test';

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

  test('navigate to home page', async () => {
    // await page.goto('http://localhost:3000');
    await expect(page.getByText('Welcome to Mockingbird')).toBeVisible();
  });

  test('login', async () => {
    await page
      .getByPlaceholder('user@example.com')
      .fill('testy.mctestface@example.com');
    await page.getByPlaceholder('Password').fill('Starts123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Sign In Error: Configuration')).toBeVisible();
  });
});
