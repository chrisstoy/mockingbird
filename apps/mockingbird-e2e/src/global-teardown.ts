import { request } from '@playwright/test';

const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:3000';

const E2E_EMAILS = [
  'flock.owner@example.com',
  'flock.member@example.com',
  'testy.mctestface@example.com',
];

export default async function globalTeardown() {
  const ctx = await request.newContext({ baseURL: BASE_URL });

  try {
    for (const email of E2E_EMAILS) {
      const res = await ctx.delete(
        `/api/test/delete-user?email=${encodeURIComponent(email)}`
      );
      if (res.ok() || res.status() === 204 || res.status() === 404) {
        console.log(`✓ Deleted test user: ${email}`);
      } else {
        console.warn(`⚠️  Could not delete ${email}: HTTP ${res.status()}`);
      }
    }
  } finally {
    await ctx.dispose();
  }
}
