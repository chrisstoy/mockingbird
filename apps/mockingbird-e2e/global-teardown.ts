import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2E Global Teardown: Starting...');

  // Database will be reset on next run, so minimal cleanup needed
  // Supabase instance stays running for next test run

  console.log('✅ E2E Global Teardown: Complete');
  console.log('💡 Supabase is still running. Stop with: npx supabase stop');
}

export default globalTeardown;
