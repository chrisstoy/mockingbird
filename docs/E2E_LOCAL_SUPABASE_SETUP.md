# Plan: Configure Local Supabase for E2E Testing

## Overview
Configure the mockingbird-e2e tests to use a local Supabase instance for isolated, fast, and reliable testing.

## Key Decisions (Confirmed)
1. **Database Reset Strategy**: Full database reset between test runs (guarantees clean state)
2. **OAuth Testing**: Skip OAuth tests in local environment (focus on email/password)
3. **Test Data Creation**:
   - UI-based for login/user creation tests (tests full signup/signin flow)
   - API-based for other test flows (faster setup for posts, comments, etc.)
4. **Scope**: Local development only (document GitHub Actions approach for future)

## Implementation Steps

### Phase 1: Supabase CLI Setup

**1.1 Install Supabase CLI**
- Add to package.json devDependencies: `"supabase": "^1.142.2"`
- Run `npm install`
- Verify installation: `npx supabase --version`

**1.2 Initialize Supabase Project**
- Run `npx supabase init` in project root
- Creates `supabase/` directory with:
  - `config.toml` - Supabase configuration
  - `seed.sql` - Optional seed data
  - `.gitignore` - Ignore local state

**1.3 Start Local Supabase**
- Run `npx supabase start` (first run downloads Docker images)
- Services started:
  - PostgreSQL (port 54322)
  - Supabase Studio (port 54323) - Database UI
  - GoTrue Auth (port 54321) - Authentication service
  - PostgREST (port 54321) - API layer
  - Inbucket (port 54324) - Email testing
- Capture credentials from `npx supabase status`

### Phase 2: Environment Configuration

**2.1 Create `.env.e2e` File**
```bash
# Supabase Local Instance
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>

# Database (Local PostgreSQL from Supabase)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Auth (Empty for local - OAuth tests skipped)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_SECRET=local-test-secret-change-in-production

# API
API_HOST=http://localhost:3000
API_PATH=/api

# Images (Local/Mock - can use existing Cloudflare or mock)
CLOUDFLARE_ACCOUNT_ID=mock
CLOUDFLARE_ACCESS_KEY_ID=mock
CLOUDFLARE_SECRET_ACCESS_KEY=mock
CLOUDFLARE_R2_BUCKET_NAME=test-bucket
IMAGES_BASE_URL=http://localhost:3000/images
IMAGES_MAX_SIZE_IN_BYTES=2097152

# Logging
LOG_LEVEL=error
LOG_DIR=logs-e2e
```

**2.2 Add `.env.e2e` to `.gitignore`**
- Ensure sensitive local configs aren't committed

### Phase 3: Database Schema Management

**3.1 Sync Prisma Schema to Supabase**
- Run `npx prisma db push` with DATABASE_URL from .env.e2e
- This creates tables in local Supabase PostgreSQL
- Alternative: Generate and apply Supabase migrations

**3.2 Verify Schema in Supabase Studio**
- Open `http://localhost:54323`
- Check that all tables exist (User, Post, Image, Friends, etc.)

### Phase 4: Playwright Configuration

**4.1 Update `apps/mockingbird-e2e/playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load E2E environment variables
dotenv.config({ path: path.join(workspaceRoot, '.env.e2e') });

const baseURL = process.env['BASE_URL'] || 'http://127.0.0.1:3000';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nx start mockingbird',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    cwd: workspaceRoot,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      // Ensure app uses .env.e2e variables
      ...process.env,
    },
  },
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
  projects: [
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
```

**4.2 Install Required Dependencies**
```bash
npm install --save-dev dotenv @supabase/supabase-js
```

### Phase 5: Global Setup & Teardown

**5.1 Create `apps/mockingbird-e2e/global-setup.ts`**
```typescript
import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

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
  execSync('npx supabase db reset --local', { stdio: 'inherit' });
  console.log('✅ Database reset complete');

  // 3. Apply Prisma schema
  console.log('📊 Applying Prisma schema...');
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
  console.log('✅ Schema applied');

  // 4. Optional: Seed base data if needed
  // execSync('npx prisma db seed', { stdio: 'inherit' });

  console.log('✅ E2E Global Setup: Complete');
}

export default globalSetup;
```

**5.2 Create `apps/mockingbird-e2e/global-teardown.ts`**
```typescript
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2E Global Teardown: Starting...');

  // Database will be reset on next run, so minimal cleanup needed
  // Supabase instance stays running for next test run

  console.log('✅ E2E Global Teardown: Complete');
  console.log('💡 Supabase is still running. Stop with: npx supabase stop');
}

export default globalTeardown;
```

### Phase 6: Test Helper Utilities

**6.1 Create `apps/mockingbird-e2e/src/supabase-helpers.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase admin client with service role key for test setup
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in environment');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create test user directly via API (for non-auth tests)
 */
export async function createTestUserDirect(email: string, password: string, name: string) {
  const supabase = getSupabaseAdmin();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for testing
    user_metadata: { name },
  });

  if (authError) throw authError;

  // Create user profile in database
  const response = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: authData.user.id,
      email,
      name,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create user profile');
  }

  return authData.user;
}

/**
 * Delete test user directly via API
 */
export async function deleteTestUserDirect(userId: string) {
  const supabase = getSupabaseAdmin();

  // Delete from database first (cascades to posts, images, etc.)
  await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'DELETE',
  });

  // Delete from auth
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

/**
 * Clean up all test users (emails matching pattern)
 */
export async function cleanupTestUsers(emailPattern = '@example.com') {
  const supabase = getSupabaseAdmin();

  // Get all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  // Delete users matching pattern
  for (const user of users) {
    if (user.email?.includes(emailPattern)) {
      await deleteTestUserDirect(user.id);
    }
  }
}
```

### Phase 7: Update Existing Tests

**7.1 Update `apps/mockingbird-e2e/src/login.spec.ts`**
- Keep UI-based user creation/deletion (tests auth flow)
- Add cleanup in afterAll hook as backup
- Skip OAuth-related tests

```typescript
import { test, expect } from '@playwright/test';
import {
  performCreateTestUser,
  performSignIn,
  performDeleteTestUser,
  TEST_USER_NAME,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
} from './utils';
import { cleanupTestUsers } from './supabase-helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication Flow', () => {
  // Cleanup any leftover test users
  test.afterAll(async () => {
    await cleanupTestUsers();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toBeVisible();
  });

  test('should create new user via signup form', async ({ page }) => {
    await performCreateTestUser(page, TEST_USER_NAME, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    // Email confirmation message should be shown
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  // Skip OAuth tests in local environment
  test.skip('OAuth signin with GitHub', async ({ page }) => {
    // OAuth requires external services - skip in local tests
  });

  test('should delete user via profile page', async ({ page }) => {
    await performSignIn(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await performDeleteTestUser(page);
  });
});
```

**7.2 Update `apps/mockingbird-e2e/src/posts.spec.ts`**
- Use API-based user creation for faster setup
- Keep UI tests for actual post operations
- Clean up in afterAll hook

```typescript
import { test, expect } from '@playwright/test';
import {
  performSignIn,
  performSignOut,
  getPostEditor,
  pauseFor,
  TEST_USER_NAME,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
} from './utils';
import { createTestUserDirect, deleteTestUserDirect } from './supabase-helpers';

test.describe.configure({ mode: 'serial' });

let testUserId: string;

test.describe('Post Management', () => {
  // Create user via API for faster setup
  test.beforeAll(async () => {
    const user = await createTestUserDirect(TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_NAME);
    testUserId = user.id;
  });

  // Clean up after all tests
  test.afterAll(async () => {
    if (testUserId) {
      await deleteTestUserDirect(testUserId);
    }
  });

  test('should create a new post', async ({ page }) => {
    await performSignIn(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    // Navigate to create post
    await page.goto('/');
    const editor = await getPostEditor(page);
    await editor.fill('This is a test post');
    await page.click('button:has-text("Post")');

    // Verify post appears
    await expect(page.locator('text=This is a test post')).toBeVisible();
  });

  // ... rest of post tests
});
```

### Phase 8: NPM Scripts

**8.1 Add to root `package.json`**
```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:restart": "supabase stop && supabase start",
    "supabase:reset": "supabase db reset --local",
    "supabase:status": "supabase status",
    "supabase:studio": "echo 'Supabase Studio: http://localhost:54323'",
    "test:e2e": "nx e2e mockingbird-e2e",
    "test:e2e:ui": "nx e2e mockingbird-e2e --ui",
    "test:e2e:debug": "nx e2e mockingbird-e2e --debug"
  }
}
```

### Phase 9: Documentation

**9.1 Create `apps/mockingbird-e2e/README.md`**
```markdown
# Mockingbird E2E Tests

## Prerequisites
- Docker installed and running
- Node.js 18+
- Supabase CLI

## Quick Start

1. **Start Local Supabase**
   ```bash
   npm run supabase:start
   ```
   First run will download Docker images (~5-10 minutes)

2. **Check Supabase Status**
   ```bash
   npm run supabase:status
   ```
   Copy credentials to `.env.e2e` if needed

3. **Run E2E Tests**
   ```bash
   npm run test:e2e
   ```

## Test Debugging

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### View Database
- Supabase Studio: http://localhost:54323
- Username: `postgres`
- Password: `postgres`

### View Test Emails
- Inbucket: http://localhost:54324

## Troubleshooting

### Tests Failing Due to Stale Data
Reset database:
```bash
npm run supabase:reset
npm run test:e2e
```

### Supabase Not Starting
Check Docker:
```bash
docker ps
```

Stop and restart:
```bash
npm run supabase:restart
```

### Port Conflicts
Supabase uses ports: 54321-54324, 54322
Ensure these are available or modify in `supabase/config.toml`

## Test Structure

- **`login.spec.ts`**: Authentication flow tests (UI-based)
- **`posts.spec.ts`**: Post creation/management (API setup, UI tests)
- **`utils.ts`**: Shared test utilities
- **`supabase-helpers.ts`**: Supabase admin functions

## Future: CI/CD Integration

For GitHub Actions setup, see: [Future CI/CD Setup](#ci-cd-notes)

### CI/CD Notes
When ready to add CI:
1. Add Supabase CLI installation step
2. Run `supabase start` in CI environment
3. Use secrets for production-like credentials
4. Run `supabase stop` in cleanup step
```

**9.2 Add `.env.e2e.example`**
Template for other developers:
```bash
# Copy this to .env.e2e and update with your local Supabase credentials
# Get credentials from: npx supabase status

NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# ... rest of template
```

## Files to Create/Modify

### New Files
1. `.env.e2e` (gitignored)
2. `.env.e2e.example` (committed)
3. `apps/mockingbird-e2e/global-setup.ts`
4. `apps/mockingbird-e2e/global-teardown.ts`
5. `apps/mockingbird-e2e/src/supabase-helpers.ts`
6. `apps/mockingbird-e2e/README.md`
7. `supabase/config.toml` (from supabase init)

### Modified Files
1. `package.json` (add scripts and devDependencies)
2. `apps/mockingbird-e2e/playwright.config.ts`
3. `apps/mockingbird-e2e/src/login.spec.ts`
4. `apps/mockingbird-e2e/src/posts.spec.ts`
5. `.gitignore` (add .env.e2e, supabase/.branches, etc.)

## Success Criteria
- ✅ Local Supabase runs successfully
- ✅ E2E tests pass with clean database state
- ✅ Tests can be run repeatedly without manual cleanup
- ✅ Database resets between test runs
- ✅ OAuth tests are skipped in local environment
- ✅ Auth flow tests use UI-based creation
- ✅ Other tests use API-based setup for speed
- ✅ Documentation is clear for other developers

## Estimated Time
- Phase 1-2: 30 minutes (Supabase setup)
- Phase 3-4: 20 minutes (Config and Playwright)
- Phase 5-6: 45 minutes (Setup/teardown and helpers)
- Phase 7: 30 minutes (Update existing tests)
- Phase 8-9: 15 minutes (Scripts and docs)
**Total: ~2.5 hours**

## Future: GitHub Actions CI/CD

When implementing CI/CD with GitHub Actions, use the following approach:

### GitHub Actions Workflow Example
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: npx supabase start

      - name: Create E2E environment file
        run: |
          echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321" >> .env.e2e
          echo "SUPABASE_URL=http://localhost:54321" >> .env.e2e
          # Get credentials from supabase status and add to .env.e2e
          ANON_KEY=$(npx supabase status | grep "anon key" | cut -d: -f2 | xargs)
          SERVICE_KEY=$(npx supabase status | grep "service_role key" | cut -d: -f2 | xargs)
          echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY" >> .env.e2e
          echo "SUPABASE_ANON_KEY=$ANON_KEY" >> .env.e2e
          echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .env.e2e
          # Add rest of env vars from secrets
          echo "AUTH_SECRET=${{ secrets.AUTH_SECRET }}" >> .env.e2e

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/mockingbird-e2e/playwright-report/
          retention-days: 30

      - name: Stop Supabase
        if: always()
        run: npx supabase stop
```

### Key CI/CD Considerations
1. Use `setup-cli@v1` action for Supabase
2. Generate `.env.e2e` dynamically from `supabase status`
3. Use GitHub secrets for sensitive values
4. Upload test reports as artifacts
5. Always stop Supabase in cleanup (even on failure)
6. Use `npx playwright install --with-deps` for browser dependencies
