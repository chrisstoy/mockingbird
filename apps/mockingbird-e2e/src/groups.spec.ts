import { expect, Page, request, test } from '@playwright/test';
import {
  BASE_URL,
  forceAcceptTOS,
  forceDeleteTestUser,
  forceVerifyTestUser,
} from './utils';

// Two dedicated test users
const ownerEmail = 'flock.owner@example.com';
const ownerPassword = 'Starts123';
const ownerName = 'Flock Owner';

const memberEmail = 'flock.member@example.com';
const memberPassword = 'Starts123';
const memberName = 'Flock Member';

// Unique per run to avoid clashes with leftover data from previous runs
const runId = Date.now().toString().slice(-6);
const publicFlockName = `E2E Public ${runId}`;
const privateFlockName = `E2E Private ${runId}`;

let publicGroupId = '';
let privateGroupId = '';

async function createUser(name: string, email: string, password: string) {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE_URL}/api/users`, {
    data: { name, email, password, confirmPassword: password, turnstileToken: 'test' },
  });
  await ctx.dispose();
  if (!res.ok() && res.status() !== 409) {
    throw new Error(`createUser failed for ${email}: HTTP ${res.status()} — ${await res.text()}`);
  }
  await forceAcceptTOS(email);
  await forceVerifyTestUser(email);
}

async function signInAs(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/signin`);
  // Wait for the form to be interactive (React hydrated)
  const emailInput = page.getByPlaceholder('Email address');
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  // Wait for redirect away from auth pages (callbackUrl may vary)
  await page.waitForURL(url => !url.href.includes('/auth/'), { timeout: 20000 });
}

async function switchToUser(page: Page, email: string, password: string) {
  await page.context().clearCookies();
  await signInAs(page, email, password);
}

test.describe('Flocks (Groups)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await forceDeleteTestUser(ownerEmail);
    await forceDeleteTestUser(memberEmail);
    await createUser(ownerName, ownerEmail, ownerPassword);
    await createUser(memberName, memberEmail, memberPassword);
  });

  test.afterAll(async () => {
    await forceDeleteTestUser(ownerEmail);
    await forceDeleteTestUser(memberEmail);
  });

  // ── Discovery ─────────────────────────────────────────────────────────

  test('flocks nav link is visible after sign-in', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    // Verify the Flocks link is present in the sidebar
    const flocksLink = page.getByRole('link', { name: 'Flocks' }).first();
    await expect(flocksLink).toBeVisible();
    // Navigate and confirm the page loads
    await page.goto(`${BASE_URL}/groups`);
    await expect(page.getByRole('heading', { name: 'Flocks' })).toBeVisible();
  });

  test('create a Flock button is present on discovery page', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups`);
    await expect(page.getByRole('link', { name: 'Create a Flock' })).toBeVisible();
  });

  // ── Create ────────────────────────────────────────────────────────────

  test('owner creates a public flock', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/new`);

    await expect(page.getByRole('heading', { name: 'Create a Flock' })).toBeVisible();
    const nameInput = page.getByPlaceholder('My Flock');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(publicFlockName);
    await page.getByPlaceholder("What is this flock about?").fill('A flock for e2e testing');
    await page.locator('select[name="visibility"]').selectOption('PUBLIC');

    // Intercept the API call to diagnose failures
    const apiResponsePromise = page.waitForResponse(
      r => r.url().includes('/api/groups') && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: 'Create Flock' }).click();
    const apiResponse = await apiResponsePromise;
    expect(apiResponse.status(), `POST /api/groups failed: ${apiResponse.status()}`).toBe(201);

    await page.waitForURL(/\/groups\/[a-z0-9]{20,}/, { timeout: 15000 });
    publicGroupId = page.url().split('/groups/')[1].split('/')[0];

    await expect(page.getByText(publicFlockName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('1 members')).toBeVisible();
  });

  test('owner creates a private flock', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/new`);

    const nameInput = page.getByPlaceholder('My Flock');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill(privateFlockName);
    await page.locator('select[name="visibility"]').selectOption('PRIVATE');
    await page.getByRole('button', { name: 'Create Flock' }).click();

    await page.waitForURL(/\/groups\/[a-z0-9]{20,}/, { timeout: 15000 });
    privateGroupId = page.url().split('/groups/')[1].split('/')[0];

    await expect(page.getByText(privateFlockName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Private', { exact: true })).toBeVisible();
    await expect(page.getByText('1 members')).toBeVisible();
  });

  // ── Discovery / Search ────────────────────────────────────────────────

  test('member can see public flocks on discovery page', async ({ page }) => {
    await switchToUser(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups`);
    await expect(page.getByText(publicFlockName)).toBeVisible({ timeout: 10000 });
  });

  test('member can search for a flock by name', async ({ page }) => {
    await signInAs(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups`);

    const searchInput = page.getByPlaceholder('Search Flocks...');
    await searchInput.fill(publicFlockName.slice(0, 8));
    await expect(page.getByText(publicFlockName).first()).toBeVisible({ timeout: 5000 });

    await searchInput.fill('zz_no_match_zz');
    await expect(page.getByText('No flocks found.')).toBeVisible({ timeout: 5000 });
  });

  // ── Join Public Flock ─────────────────────────────────────────────────

  test('member sees Join Flock button on public group page', async ({ page }) => {
    await signInAs(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}`);

    await expect(page.getByRole('button', { name: 'Join Flock' })).toBeVisible();
    await expect(page.getByText('1 members')).toBeVisible();
  });

  test('member joins the public flock', async ({ page }) => {
    await signInAs(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}`);

    await page.getByRole('button', { name: 'Join Flock' }).click();

    // Join button disappears after joining; member count increases
    await expect(page.getByRole('button', { name: 'Join Flock' })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('2 members')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(memberName).first()).toBeVisible();
  });

  // ── Post to Group Feed ────────────────────────────────────────────────

  test('member sees post composer after joining', async ({ page }) => {
    await signInAs(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}`);

    await expect(page.getByPlaceholder('Share something with the flock...')).toBeVisible();
  });

  test('member can post to the flock feed', async ({ page }) => {
    await signInAs(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}`);

    const composer = page.getByPlaceholder('Share something with the flock...');
    await composer.fill('Hello Flock!');

    const postResponsePromise = page.waitForResponse(
      r => r.url().includes('/api/posts') && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: 'Post' }).click();
    const postResponse = await postResponsePromise;
    expect(postResponse.status(), `POST /api/posts failed: ${postResponse.status()}`).toBe(201);

    // Wait for textarea to clear (confirms setContent('') ran after success)
    await expect(composer).toHaveValue('', { timeout: 10000 });
    // Post should appear in feed (inside a feed-post element, not the textarea)
    await expect(page.locator('[data-testid="feed-post"]').filter({ hasText: 'Hello Flock!' })).toBeVisible({ timeout: 10000 });
  });

  test('owner can see member post in flock feed', async ({ page }) => {
    await switchToUser(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}`);

    await expect(page.locator('[data-testid="feed-post"]').filter({ hasText: 'Hello Flock!' })).toBeVisible({ timeout: 10000 });
  });

  // ── Private Flock / Join Request ──────────────────────────────────────

  test('member sees Request to Join button on private flock', async ({ page }) => {
    await switchToUser(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${privateGroupId}`);

    await expect(page.getByRole('button', { name: 'Request to Join' })).toBeVisible();
  });

  test('member can request to join a private flock', async ({ page }) => {
    await signInAs(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${privateGroupId}`);

    await page.getByRole('button', { name: 'Request to Join' }).click();
    await expect(page.getByText('Request sent!')).toBeVisible({ timeout: 5000 });
  });

  test('owner sees join request in admin section', async ({ page }) => {
    await switchToUser(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${privateGroupId}`);

    await expect(page.getByRole('heading', { name: 'Join Requests' })).toBeVisible();
    await expect(page.getByText(memberName).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();
  });

  test('owner accepts join request', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${privateGroupId}`);

    await page.getByRole('button', { name: 'Accept' }).click();

    // Request disappears from the list
    await expect(page.getByRole('button', { name: 'Accept' })).not.toBeVisible({ timeout: 10000 });
    // Member count increments
    await expect(page.getByText('2 members')).toBeVisible({ timeout: 10000 });
  });

  test('member can now post to private flock after being accepted', async ({ page }) => {
    await switchToUser(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${privateGroupId}`);

    const composer = page.getByPlaceholder('Share something with the flock...');
    await expect(composer).toBeVisible();
    await composer.fill('Made it in!');
    await page.getByRole('button', { name: 'Post' }).click();

    await expect(page.getByText('Made it in!')).toBeVisible({ timeout: 10000 });
  });

  // ── Settings ──────────────────────────────────────────────────────────

  test('settings page is accessible to owner', async ({ page }) => {
    await switchToUser(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}/settings`);

    await expect(page.getByRole('heading', { name: 'Flock Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Disable Flock' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Posts' })).toBeVisible();
  });

  test('owner can edit flock description via settings', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}/settings`);

    await page.locator('textarea[name="description"]').fill('Updated e2e description');

    const saveResponsePromise = page.waitForResponse(
      r => r.url().includes(`/api/groups/${publicGroupId}`) && r.request().method() === 'PATCH',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: 'Save Changes' }).click();
    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status(), `PATCH /api/groups failed: ${saveResponse.status()}`).toBe(200);

    await page.goto(`${BASE_URL}/groups/${publicGroupId}`);
    await expect(page.getByText('Updated e2e description')).toBeVisible({ timeout: 10000 });
  });

  test('non-admin is redirected away from settings page', async ({ page }) => {
    await switchToUser(page, memberEmail, memberPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}/settings`);

    // Should redirect back to group page (not settings)
    await expect(page).not.toHaveURL(/\/settings/, { timeout: 5000 });
  });

  // ── Disable & Delete ──────────────────────────────────────────────────

  test('owner can disable a flock', async ({ page }) => {
    await switchToUser(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}/settings`);

    await page.getByRole('button', { name: 'Disable Flock' }).click();

    await expect(page.getByRole('button', { name: 'Re-enable Flock' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Delete Flock' })).toBeVisible();
  });

  test('disabled flock shows Disabled badge on group page', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}`);

    await expect(page.getByText('Disabled')).toBeVisible();
  });

  test('owner can delete a disabled flock', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    await page.goto(`${BASE_URL}/groups/${publicGroupId}/settings`);

    await page.getByRole('button', { name: 'Delete Flock' }).click();
    await expect(page.getByText('Are you sure? This is permanent.')).toBeVisible();

    await page.getByRole('button', { name: 'Yes, Delete' }).click();

    // Redirects to /groups
    await page.waitForURL(`${BASE_URL}/groups`, { timeout: 10000 });
    await expect(page.locator('main').getByText(publicFlockName)).not.toBeVisible({ timeout: 10000 });
  });

  // ── FeedSelector ──────────────────────────────────────────────────────

  test('joined flock appears in header feed selector', async ({ page }) => {
    await signInAs(page, ownerEmail, ownerPassword);
    // The private flock is still active with owner as member
    await expect(page.getByRole('button', { name: `🐦 ${privateFlockName}` })).toBeVisible({ timeout: 10000 });
  });
});
