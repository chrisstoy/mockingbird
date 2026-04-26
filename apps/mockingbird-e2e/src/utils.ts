import { Locator, Page, request } from '@playwright/test';

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
  await page.getByRole('link', { name: 'Create one' }).click();

  await page.getByPlaceholder('Full name').fill(testUserName);
  await page.getByPlaceholder('Email address').fill(testUserEmail);
  await page.getByPlaceholder('Password', { exact: true }).fill(testUserPassword);
  await page.getByPlaceholder('Confirm password', { exact: true }).fill(testUserPassword);
  await page.getByRole('button', { name: 'Create Account' }).click();
}

export async function performSignInTestUser(page: Page) {
  await page.getByPlaceholder('Email address').fill(testUserEmail);
  await page.getByPlaceholder('Password').fill(testUserPassword);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

export async function performSignOut(page: Page) {
  await page.goto(`${BASE_URL}/profile`);
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).last().click();
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

export const BASE_URL =
  process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:3000';

export async function forceDeleteTestUser(userEmailToDelete?: string) {
  const ctx = await request.newContext();
  const res = await ctx.delete(
    `${BASE_URL}/api/test/delete-user?email=${encodeURIComponent(
      userEmailToDelete || testUserEmail
    )}`
  );
  await ctx.dispose();
  if (!res.ok() && res.status() !== 204) {
    throw new Error(`forceDeleteTestUser failed: ${res.status()}`);
  }
}

export async function getTestResetToken(
  email: string,
  options?: { forceExpire?: boolean }
): Promise<string> {
  const ctx = await request.newContext();
  const url = `${BASE_URL}/api/test/reset-token?email=${encodeURIComponent(
    email
  )}${options?.forceExpire ? '&force_expire=1' : ''}`;
  const res = await ctx.get(url);
  const data = await res.json();
  await ctx.dispose();
  if (!res.ok()) throw new Error(`getTestResetToken failed: ${data.error}`);
  return data.token as string;
}

export async function expireTestUserPassword(email: string): Promise<void> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE_URL}/api/test/expire-password`, {
    data: { email },
  });
  await ctx.dispose();
  if (!res.ok()) throw new Error(`expireTestUserPassword failed`);
}

export async function forceVerifyTestUser(
  userEmailToVerify?: string
): Promise<void> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE_URL}/api/test/verify-email`, {
    data: { email: userEmailToVerify || testUserEmail },
  });
  await ctx.dispose();
  if (!res.ok()) throw new Error(`forceVerifyTestUser failed: ${res.status()}`);
}

export async function forceAcceptTOS(userEmailToAccept?: string): Promise<void> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE_URL}/api/test/accept-tos`, {
    data: { email: userEmailToAccept || testUserEmail },
  });
  await ctx.dispose();
  if (!res.ok()) throw new Error(`forceAcceptTOS failed: ${res.status()}`);
}
