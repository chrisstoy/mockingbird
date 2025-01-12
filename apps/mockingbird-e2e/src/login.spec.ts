import { test, expect, Page } from '@playwright/test';

const testUserName = 'Testy McTestface';
const testUserEmail = 'testy.mctestface@example.com';
const testUserPassword = 'Starts123';

async function performSignIn(page: Page) {
  await page.goto('http://localhost:3000/auth/signin');
  await page.getByPlaceholder('user@example.com').fill(testUserEmail);
  await page.getByPlaceholder('Password').fill(testUserPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function performSignOut(page: Page) {
  await page.getByRole('img', { name: 'User Profile' }).click();
  await page.getByText('Sign Out').click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
}

function getSignInHeading(page: Page) {
  return page.getByRole('heading', { name: 'Sign In', exact: true });
}

test.describe.configure({ mode: 'serial' });

test.describe('Login and Account Creation', () => {
  let page: Page;
  // test.beforeAll(async ({ browser }) => {
  //   page = await browser.newPage();
  //   await page.goto('http://localhost:3000');
  // });

  // test.afterAll(async () => {
  //   await page?.close();
  // });

  // replace beforeAll and afterAll with this for debugging tests
  test.beforeEach(async ({ page: _page }) => {
    page = _page;
    // await page.goto('http://localhost:3000');
  });

  test('start at login page', async () => {
    await page.goto('http://localhost:3000');
    await expect(getSignInHeading(page)).toBeVisible();
  });

  test('login with invalid user', async () => {
    await performSignIn(page);

    await expect(
      page.getByText('There was an authentication error:')
    ).toBeVisible();

    await page.getByRole('link', { name: 'Sign in' }).click();
  });

  test('create new user', async () => {
    await page.goto('http://localhost:3000/auth/signin');
    await page.getByRole('link', { name: 'Create new account' }).click();

    await page.getByPlaceholder('Full Name').fill(testUserName);
    await page.getByPlaceholder('user@example.com').fill(testUserEmail);
    await page
      .getByPlaceholder('Password', { exact: true })
      .fill(testUserPassword);
    await page
      .getByPlaceholder('Confirm Password', { exact: true })
      .fill(testUserPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(
      page.getByRole('button', { name: "What's going on, Testy?" })
    ).toBeVisible();

    await performSignOut(page);
    await expect(getSignInHeading(page)).toBeVisible();
  });

  test('delete user', async () => {
    await performSignIn(page);

    await page.getByRole('img', { name: 'User Profile' }).click();
    await page.getByText('Profile').click();
    await page.getByRole('button', { name: 'Delete Account' }).click();
    await page.getByPlaceholder('Email').click();
    await page.getByPlaceholder('Email').fill('testy.mctestface@example.com');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete Account' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete Account' })
      .click();

    await expect(getSignInHeading(page)).toBeVisible();

    // ensure user was deleted
    await performSignIn(page);
    await expect(
      page.getByText('There was an authentication error:')
    ).toBeVisible();
  });
});
