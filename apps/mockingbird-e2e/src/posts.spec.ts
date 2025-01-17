import { test, expect, Page, Locator } from '@playwright/test';
import {
  getPostEditor,
  pauseFor,
  performCreateTestUser,
  performDeleteTestUser,
  performSignIn,
  testUserName,
} from './utils';
import { get } from 'http';

const getCreatePostButton = (page: Page) =>
  page.getByRole('button', { name: "What's going on" });

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
    await getPostEditor(dialog).fill('This is a test post.');
    await dialog.getByRole('button', { name: 'Post' }).click();

    await expect(posts).toHaveCount(1);

    // ensure the post has all the expected content
    const post = posts.first();
    await expect(post).toBeVisible();
    await expect(post.getByText(testUserName)).toBeVisible();
    await expect(post.getByText('This is a test post.')).toBeVisible();
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
    expect(dialog.getByText('This is a test post.')).toBeVisible();

    const editor = getPostEditor(dialog);
    await editor.fill('Comment for test post.');
    await dialog.getByRole('button', { name: 'Post' }).click();
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
