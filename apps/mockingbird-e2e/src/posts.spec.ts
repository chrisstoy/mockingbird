import { expect, Page, test } from '@playwright/test';
import {
  getPostEditor,
  pauseFor,
  performCreateTestUser,
  performDeleteTestUser,
  performSignIn,
  testUserName,
} from './utils';

const getCreatePostButton = (page: Page) =>
  page.getByRole('button', { name: "What's going on" });

const testPostContent = 'TEST Post 1';
const testCommentContent = 'TEST Comment 1';
const testReplyContent = 'TEST Reply 1';

test.describe('Creating and commenting on posts', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('create test user', async ({ page }) => {
    await performCreateTestUser(page);
    await expect(getCreatePostButton(page)).toBeVisible();
  });

  test('create post', async ({ page }) => {
    await performSignIn(page);
    await pauseFor(1000);

    const posts = page.getByRole('listitem');
    await expect(posts).toHaveCount(0);

    await getCreatePostButton(page).click();
    await pauseFor(1000);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('paragraph').click();
    await getPostEditor(dialog).fill(testPostContent);
    await dialog.getByRole('button', { name: 'Post' }).click();

    await expect(posts).toHaveCount(1);

    // ensure the post has all the expected content
    const post = posts.first();
    await expect(post).toBeVisible();
    await expect(post.getByText(testUserName)).toBeVisible();
    await expect(post.getByText(testPostContent)).toBeVisible();
    await expect(post.getByRole('button', { name: 'Options' })).toBeVisible();
    await expect(post.getByRole('button', { name: 'Comment' })).toBeVisible();
  });

  test('comment on post', async ({ page }) => {
    await performSignIn(page);

    const posts = page.getByRole('listitem');
    await expect(posts).toHaveCount(1);

    const post = posts.first();
    await post.getByRole('button', { name: 'Comment' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(testPostContent)).toBeVisible();

    const editor = getPostEditor(dialog);
    await editor.fill(testCommentContent);
    const postButton = dialog.getByRole('button', { name: 'Post' });
    await expect(postButton).toBeVisible();
    await postButton.click();

    await expect(dialog).toBeHidden();
    await expect(posts).toHaveCount(2);

    // ensure the comment has all the expected content
    const comment = posts.last();
    await expect(comment).toBeVisible();
    await expect(comment.getByText(testUserName)).toBeVisible();
    await expect(comment.getByText(testCommentContent)).toBeVisible();
    await expect(
      comment.getByRole('button', { name: 'Options' })
    ).toBeVisible();
    await expect(comment.getByRole('button', { name: 'Reply' })).toBeVisible();
  });

  test('reply to comment', async ({ page }) => {
    await performSignIn(page);

    const posts = page.getByRole('listitem');
    // await expect(posts).toHaveCount(2);

    const replyButton = page.getByRole('button', { name: 'Reply' });
    await expect(replyButton).toBeVisible();
    const editor = getPostEditor(page);

    await replyButton.click();
    await expect(editor).toBeVisible();
    await editor.fill(testReplyContent);
    await expect(editor).toHaveText(testReplyContent);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(editor).toBeHidden();
    await expect(posts).toHaveCount(2);

    await replyButton.click();
    await editor.fill(testReplyContent);
    await expect(editor).toHaveText(testReplyContent);

    const postButton = page.getByRole('button', { name: 'Post' });
    await expect(postButton).toBeVisible();
    await postButton.click();

    await expect(editor).toBeHidden();
    await expect(posts).toHaveCount(2);
  });

  test('delete post', async ({ page }) => {
    await performSignIn(page);

    const initialPosts = page.getByRole('listitem');
    await expect(initialPosts).toHaveCount(2);

    const originalPost = initialPosts.first();
    await originalPost.getByRole('button', { name: 'Options' }).first().click();
    await originalPost.getByRole('button', { name: 'Delete' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Ok' }).click();

    const updatedPosts = page.getByRole('listitem');
    await expect(updatedPosts).toHaveCount(0);
  });

  test('delete test user', async ({ page }) => {
    await performSignIn(page);
    await performDeleteTestUser(page);
  });
});
