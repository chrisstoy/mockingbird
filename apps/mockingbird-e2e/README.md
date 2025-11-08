# Mockingbird E2E Tests

End-to-end tests for Mockingbird using Playwright and local Supabase.

## Prerequisites

- **Docker Desktop** installed and running
- **Node.js 18+**
- **Supabase CLI** (installed via npm)

## Quick Start

### 1. Start Local Supabase

```bash
npm run supabase:start
```

First run will download Docker images (~5-10 minutes). Subsequent runs are fast.

### 2. Check Supabase Status

```bash
npm run supabase:status
```

Copy credentials to `.env.e2e` if needed (file should already exist from setup).

### 3. Run E2E Tests

```bash
npm run test:e2e
```

Tests will automatically:
- Reset the database to a clean state
- Apply Prisma schema
- Start the Next.js dev server
- Run all tests
- Clean up test data

## Available Commands

### Supabase Management

```bash
npm run supabase:start      # Start local Supabase
npm run supabase:stop       # Stop local Supabase
npm run supabase:restart    # Stop and restart Supabase
npm run supabase:reset      # Reset database to clean state
npm run supabase:status     # Show status and credentials
npm run supabase:studio     # Display Studio URL (http://localhost:54323)
```

### E2E Testing

```bash
npm run test:e2e           # Run all E2E tests (headless)
npm run test:e2e:ui        # Run with Playwright UI (interactive)
npm run test:e2e:debug     # Run in debug mode
```

## Test Debugging

### Interactive UI Mode

The Playwright UI provides:
- Visual test selection
- Time-travel debugging
- Screenshot comparison
- Network request inspection

```bash
npm run test:e2e:ui
```

### Debug Mode

Step through tests line by line:

```bash
npm run test:e2e:debug
```

### View Database

Access Supabase Studio to inspect database state:

**URL:** http://localhost:54323
**Username:** `postgres`
**Password:** `postgres`

### View Test Emails

Inbucket captures all emails sent during tests:

**URL:** http://localhost:54324

## Test Structure

### Test Files

- **`login.spec.ts`** - Authentication flow tests (UI-based user creation)
- **`posts.spec.ts`** - Post creation and management (API-based user setup)
- **`utils.ts`** - Shared test utilities and page helpers
- **`supabase-helpers.ts`** - Supabase admin functions for test data

### Test Data Strategy

**Authentication Tests (`login.spec.ts`):**
- Uses UI-based user creation via signup forms
- Tests the full authentication flow
- OAuth tests are skipped (requires external services)
- Cleanup via `cleanupTestUsers()` in `afterAll` hook

**Feature Tests (`posts.spec.ts`):**
- Uses API-based user creation via `createTestUserDirect()`
- Faster test setup (doesn't test auth UI)
- Automatic cleanup via `deleteTestUserDirect()` in `afterAll` hook

### Global Hooks

**Global Setup (`global-setup.ts`):**
1. Verify Supabase is running
2. Reset database to clean state
3. Apply Prisma schema
4. Ready for tests

**Global Teardown (`global-teardown.ts`):**
1. Minimal cleanup (database reset on next run)
2. Supabase stays running for next test

## Troubleshooting

### Tests Failing Due to Stale Data

Reset the database:

```bash
npm run supabase:reset
npm run test:e2e
```

### Supabase Not Starting

Check if Docker is running:

```bash
docker ps
```

If no containers are running, start Docker Desktop and retry:

```bash
npm run supabase:start
```

### Port Conflicts

Supabase uses these ports:
- **54321** - API, Auth, Storage
- **54322** - PostgreSQL
- **54323** - Supabase Studio
- **54324** - Inbucket (email testing)

Ensure these ports are available or modify in `supabase/config.toml`.

### Database Schema Out of Sync

If you've modified the Prisma schema:

```bash
npm run supabase:reset
npm run test:e2e
```

This resets the database and applies the latest schema.

### "Supabase is not running" Error

The global setup checks if Supabase is running. If you see this error:

```bash
npm run supabase:start
npm run test:e2e
```

## Environment Configuration

Tests use `.env.e2e` for configuration. This file contains:

- Supabase URLs and keys (from local instance)
- Local PostgreSQL database connection
- Mock OAuth credentials (OAuth tests skipped)
- Mock Cloudflare R2 configuration
- Logging settings

**Important:** `.env.e2e` is gitignored. Use `.env.e2e.example` as a template.

## Test Isolation

Each test run:
1. Resets the database completely
2. Applies the Prisma schema
3. Creates fresh test users as needed
4. Cleans up test data after completion

This ensures:
- No test pollution
- Predictable test state
- Fast recovery from failures
- Repeatable results

## Local Development Workflow

### Daily Workflow

```bash
# Start Supabase (once per day or after restart)
npm run supabase:start

# Run tests as you develop
npm run test:e2e

# View database if needed
npm run supabase:studio

# Stop Supabase when done (optional)
npm run supabase:stop
```

### After Prisma Schema Changes

```bash
# Reset database with new schema
npm run supabase:reset

# Run tests to verify
npm run test:e2e
```

### Debugging Failed Tests

```bash
# Run with UI for visual debugging
npm run test:e2e:ui

# Or run in debug mode
npm run test:e2e:debug

# Check database state
npm run supabase:studio
# Visit http://localhost:54323
```

## CI/CD Integration (Future)

When implementing GitHub Actions CI/CD, refer to the plan document for:
- Supabase CLI installation in CI
- Dynamic `.env.e2e` generation
- GitHub secrets configuration
- Test artifact uploads

See `docs/E2E_LOCAL_SUPABASE_SETUP.md` for CI/CD implementation details.

## Additional Resources

- **Playwright Docs:** https://playwright.dev/docs/intro
- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Supabase Local Development:** https://supabase.com/docs/guides/cli/local-development

## Support

If you encounter issues:

1. Check this README's Troubleshooting section
2. Review `docs/E2E_LOCAL_SUPABASE_SETUP.md`
3. Check Supabase status: `npm run supabase:status`
4. Verify Docker is running: `docker ps`
5. Reset everything: `npm run supabase:reset`
