import { Locator, Page } from '@playwright/test';

export const testUserName = `Testy McTestface`;
export const testUserEmail = 'testy.mctestface@example.com';
export const testUserPassword = 'Starts123';

/**
 * Locate the Post TextEditor rooted at the parent.
 * @param parent Locator or Page to start looking for editor
 * @returns Locator to the TextEditor
 */
export function getPostEditor(parent: Locator | Page) {
  return parent.getByTestId('post-editor').locator('.ql-editor');
}

/**
 * Pauses for the specified number of milliseconds
 * @param milliseconds Number of milliseconds to pause
 */
export async function pauseFor(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function performCreateTestUser(page: Page) {
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
}

export async function performSignIn(page: Page) {
  await page.getByPlaceholder('user@example.com').fill(testUserEmail);
  await page.getByPlaceholder('Password').fill(testUserPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function performSignOut(page: Page) {
  await page.getByRole('img', { name: 'User Profile' }).click();
  await page.getByText('Sign Out').click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
}

export async function performDeleteTestUser(page: Page) {
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
}
