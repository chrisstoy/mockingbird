import { expect, test } from '@playwright/test';
import {
  BASE_URL,
  forceAcceptTOS,
  forceDeleteTestUser,
  forceVerifyTestUser,
  getPostEditor,
  performSignOut,
} from './utils';

// Dedicated credentials for post tests
const postTestEmail = 'post.testy@example.com';
const postTestPassword = 'Starts123';

const testPostContent = 'TEST Post 1';
const testCommentContent = 'TEST Comment 1';
const testReplyContent = 'TEST Reply 1';

async function createPostTestUser() {
  const { request: playwrightRequest } = await import('@playwright/test');
  const ctx = await playwrightRequest.newContext();
  const res = await ctx.post(`${BASE_URL}/api/users`, {
    data: {
      name: 'Post Testy',
      email: postTestEmail,
      password: postTestPassword,
      confirmPassword: postTestPassword,
      turnstileToken: 'test',
    },
  });
  await ctx.dispose();
  return res;
}

async function signIn(page: import('@playwright/test').Page) {
  try {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'load' });
  } catch {
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'load' });
  }
  await page.getByPlaceholder('Email address').fill(postTestEmail);
  await page.getByPlaceholder('Password').fill(postTestPassword);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
}

test.describe('post management', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await forceDeleteTestUser(postTestEmail);
    await createPostTestUser();
    await forceAcceptTOS(postTestEmail);
    await forceVerifyTestUser(postTestEmail);
  });

  test.afterAll(async () => {
    await forceDeleteTestUser(postTestEmail);
  });

  test('create post', async ({ page }) => {
    await signIn(page);

    // Open editor via pencil icon
    await page.getByRole('button', { name: 'New post' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Type post content into Quill editor inside dialog
    const editor = getPostEditor(dialog);
    await editor.click();
    await editor.fill(testPostContent);

    await dialog.getByRole('button', { name: 'Post' }).click();

    // Our new post should appear in the feed
    const post = page.getByTestId('feed-post').filter({ hasText: testPostContent });
    await expect(post).toBeVisible({ timeout: 10000 });
    await expect(post.getByTitle('Options')).toBeVisible();
    await expect(post.getByRole('button', { name: 'Comment' })).toBeVisible();
    // All 6 reaction buttons should be present
    await expect(post.getByRole('button', { name: 'Like', exact: true })).toBeVisible();
  });

  test('react to post', async ({ page }) => {
    await signIn(page);

    const post = page.getByTestId('feed-post').filter({ hasText: testPostContent });
    const likeButton = post.getByRole('button', { name: 'Like', exact: true });

    // Add Like reaction
    await likeButton.click();
    // Count of 1 should appear on the button
    await expect(likeButton).toContainText('1', { timeout: 5000 });

    // Toggle Like off (same button click removes it)
    await likeButton.click();
    await expect(likeButton).not.toContainText('1', { timeout: 5000 });
  });

  test('comment on post', async ({ page }) => {
    await signIn(page);

    const post = page.getByTestId('feed-post').filter({ hasText: testPostContent });
    await post.getByRole('button', { name: 'Comment' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(testPostContent)).toBeVisible();

    const editor = getPostEditor(dialog);
    await editor.click();
    await editor.fill(testCommentContent);
    await dialog.getByRole('button', { name: 'Post' }).click();

    await expect(dialog).toBeHidden({ timeout: 10000 });

    // Comment appears beneath the post
    await expect(page.getByText(testCommentContent)).toBeVisible({ timeout: 10000 });
  });

  test('reply to comment - cancel discards reply', async ({ page }) => {
    await signIn(page);

    // Navigate to post detail page so replies are visible (home feed hides them)
    await page.getByRole('link', { name: testPostContent }).first().click();
    await page.waitForURL(/\/post\//);

    // Click Reply on the comment
    const replyButton = page.getByRole('button', { name: 'Reply' }).first();
    await expect(replyButton).toBeVisible();
    await replyButton.click();

    // Inline TextEditor appears
    const editor = getPostEditor(page);
    await expect(editor).toBeVisible();
    await editor.fill(testReplyContent);

    // Cancel (trash icon button containing a span with data-tip="Cancel")
    await page.locator('button:has([data-tip="Cancel"])').click();

    // Editor should be hidden after cancel
    await expect(editor).toBeHidden();

    // Original comment still visible
    await expect(page.getByText(testCommentContent)).toBeVisible();
  });

  test('reply to comment - submit adds reply', async ({ page }) => {
    await signIn(page);

    // Navigate to post detail page so replies are visible (home feed hides them)
    await page.getByRole('link', { name: testPostContent }).first().click();
    await page.waitForURL(/\/post\//);

    const replyButton = page.getByRole('button', { name: 'Reply' }).first();
    await replyButton.click();

    const editor = getPostEditor(page);
    await expect(editor).toBeVisible();
    await editor.fill(testReplyContent);

    // Submit (paper airplane icon button containing a span with data-tip="Post")
    await page.locator('button:has([data-tip="Post"])').click();

    await expect(editor).toBeHidden({ timeout: 5000 });
    await expect(page.getByText(testReplyContent)).toBeVisible({ timeout: 10000 });
  });

  test('delete comment', async ({ page }) => {
    await signIn(page);

    // The comment is shown inline; its Options button is within the comment card
    const commentCard = page.locator('.card.card-compact').filter({ hasText: testCommentContent });
    await expect(commentCard).toBeVisible();

    await commentCard.getByTitle('Options').click();
    await commentCard.getByRole('button', { name: 'Delete' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Ok' }).click();

    // Comment should be gone
    await expect(page.getByText(testCommentContent)).toBeHidden({ timeout: 10000 });
  });

  test('delete post', async ({ page }) => {
    await signIn(page);

    const post = page.getByTestId('feed-post').filter({ hasText: testPostContent });
    await expect(post).toBeVisible();

    await post.getByTitle('Options').click();
    await post.getByRole('button', { name: 'Delete' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Ok' }).click();

    // Our post should be gone from the feed
    await expect(page.getByTestId('feed-post').filter({ hasText: testPostContent })).toBeHidden({ timeout: 10000 });

    await performSignOut(page);
  });
});
