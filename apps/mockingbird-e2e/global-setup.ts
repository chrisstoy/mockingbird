import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🔧 E2E Global Setup: Starting...');

  // 1. Verify Supabase is running
  try {
    execSync('npx supabase status', { stdio: 'pipe' });
    console.log('✅ Supabase is running');
  } catch (error) {
    console.error('❌ Supabase is not running. Please run: npx supabase start');
    throw new Error('Supabase local instance is not running');
  }

  // 2. Reset database to clean state
  console.log('🗑️  Resetting database...');
  try {
    execSync('npx supabase db reset --local', { stdio: 'inherit' });
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('⚠️  Database reset failed, continuing...');
  }

  // 3. Apply Prisma schema
  console.log('📊 Applying Prisma schema...');
  const workspaceRoot = path.resolve(__dirname, '../..');
  const prismaPath = path.join(workspaceRoot, 'apps/mockingbird');

  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      cwd: prismaPath,
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
        DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      },
    });
    console.log('✅ Schema applied');
  } catch (error) {
    console.error('❌ Failed to apply Prisma schema');
    throw error;
  }

  // 4. Optional: Seed base data if needed
  // execSync('npx prisma db seed', { stdio: 'inherit', cwd: prismaPath });

  console.log('✅ E2E Global Setup: Complete');
}

export default globalSetup;
