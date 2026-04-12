# Mockingbird — Software Development Lifecycle

## Environments

| Environment    | URL                                 | Git Branch | Database                       |
| -------------- | ----------------------------------- | ---------- | ------------------------------ |
| Local dev      | `http://localhost:3000`             | any        | CockroachDB (dev instance)     |
| Pre-production | `https://mockingbird.chrisstoy.com` | `develop`  | CockroachDB (preview instance) |
| Production     | `https://mockingbird.club`          | `main`     | CockroachDB (prod instance)    |

All environments share a single Vercel project. Vercel maps branches to environments:

- `develop` → Preview environment (aliased to `mockingbird.chrisstoy.com`)
- `main` → Production environment (`mockingbird.club`)

---

## Branching Strategy

```
main          ← production-only; merge from develop after pre-prod validation
  └─ develop  ← integration branch; feature branches merge here
       └─ feature/*, fix/*, chore/*  ← short-lived work branches
```

- All work is done on feature branches cut from `develop`.
- PRs target `develop`. CI must pass before merge.
- Promotion to `main` is a merge from `develop` after pre-prod validation passes.
- Direct commits to `main` are not allowed except for hotfixes (see Hotfix section).

---

## Local Development

### Prerequisites

- Node.js 22
- npm (not pnpm or yarn — see `CLAUDE.md`)
- Access to CockroachDB dev instance
- Vercel CLI: `npm i -g vercel` (upgrade: `npm i -g vercel@latest`)

### First-Time Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd mockingbird
npm ci

# 2. Set up environment variables
cp apps/mockingbird/.env.local.example apps/mockingbird/.env.local   # if example exists
# OR pull from Vercel (requires vercel link first):
vercel link
vercel env pull apps/mockingbird/.env.local --environment=development

# Required vars in .env.local:
#   DATABASE_URL          — CockroachDB dev connection string
#   AUTH_SECRET           — JWT signing secret
#   AUTH_GITHUB_ID / AUTH_GITHUB_SECRET
#   AUTH_GOOGLE_ID  / AUTH_GOOGLE_SECRET
#   CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_R2_BUCKET_NAME
#   CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_SECRET_ACCESS_KEY
#   IMAGES_BASE_URL
#   TURNSTILE_SECRET_KEY / NEXT_PUBLIC_TURNSTILE_SITE_KEY

# 3. Generate Prisma client
nx run mockingbird:prisma-generate

# 4. Run DB migrations against dev database
nx run mockingbird:prisma-migrate

# 5. (Optional) Seed an admin user (request email from the user)
./scripts/make-admin.sh dev <your-email>
```

### Running the Dev Server

```bash
nx run mockingbird:dev
# App available at http://localhost:3000
```

### After Schema Changes

Any change to `apps/mockingbird/prisma/schema.prisma` requires:

```bash
nx run mockingbird:prisma-generate    # regenerate Prisma client
nx run mockingbird:prisma-migrate     # create + apply migration to dev DB
```

---

## Testing

### Unit Tests

```bash
nx run mockingbird:test               # run tests for main app
nx run-many -t test                   # run tests across all workspace projects
```

Run with `--skip-nx-cache` if you suspect stale cached results:

```bash
nx run mockingbird:test --skip-nx-cache
```

### Type Checking

```bash
nx run mockingbird:type-check
```

### Linting

```bash
nx run mockingbird:lint
```

### E2E Tests (Playwright)

> **Status**: Scaffolded. Tests must be written before E2E is a hard gate.

E2E tests are located in `apps/mockingbird-e2e/`. They must pass locally and against the preview deployment before merging to `main`.

```bash
# Run against local dev server (start dev server first)
nx run mockingbird-e2e:e2e

# Run against pre-prod (set baseURL in playwright config or via env var)
PLAYWRIGHT_BASE_URL=https://mockingbird.chrisstoy.com nx run mockingbird-e2e:e2e
```

### CI Gates (GitHub Actions)

On every push to `main`/`develop` and on all PRs, GitHub Actions runs:

```bash
npm ci
nx run mockingbird:prisma-generate
npx nx affected -t lint test type-check
```

All checks must be green before a PR can be merged.

---

## Database Migrations

Migrations must be run **manually before deploying** to each environment. They are not automated in the Vercel build.

### Pre-production (preview database)

```bash
# Ensure .env.preview has the preview DATABASE_URL
DATABASE_URL=$(grep '^DATABASE_URL=' apps/mockingbird/.env.preview | cut -d= -f2-) \
  nx run mockingbird:prisma-migrate
```

Or using the Prisma deploy executor (applies pending migrations without prompts — safe for CI):

```bash
DATABASE_URL=<preview-db-url> nx run mockingbird:prisma-deploy
```

### Production

```bash
vercel env pull /tmp/deploy-env --environment=production
DATABASE_URL=$(grep '^DATABASE_URL=' /tmp/deploy-env | cut -d= -f2- | tr -d '"') \
  npx prisma migrate deploy --schema=apps/mockingbird/prisma/schema.prisma
rm /tmp/deploy-env
# Or if apps/mockingbird/.env.prod is up to date:
# DATABASE_URL=$(grep '^DATABASE_URL=' apps/mockingbird/.env.prod | cut -d= -f2-) \
#   nx run mockingbird:prisma-deploy
```

> Use `prisma-deploy` (not `prisma-migrate`) in non-local environments — it applies pending migrations without creating new ones and never prompts interactively.

---

## Deployment

Deployments are triggered automatically by Vercel on push to the mapped branches. The Vercel build runs the `build-vercel` Nx target:

```
prisma-generate → update-build-date → build
```

This is configured in `apps/mockingbird/project.json` (`build-vercel` target) and invoked by Vercel's build command.

### Pre-production Deploy (`develop` → `mockingbird.chrisstoy.com`)

```bash
# 1. Merge feature branch into develop (via PR; CI must pass)
git checkout develop
git pull origin develop

# 2. Enable maintenance mode
vercel env rm MAINTENANCE_MODE preview --yes 2>/dev/null; echo "true" | vercel env add MAINTENANCE_MODE preview

# 3. Run DB migrations against preview database (manual step)
#    Pull the preview DATABASE_URL from Vercel, then apply pending migrations:
vercel env pull /tmp/deploy-env --environment=preview
DATABASE_URL=$(grep '^DATABASE_URL=' /tmp/deploy-env | cut -d= -f2- | tr -d '"') \
  npx prisma migrate deploy --schema=apps/mockingbird/prisma/schema.prisma
rm /tmp/deploy-env
#    Or if apps/mockingbird/.env.preview is up to date (see Env Var Management):
#    DATABASE_URL=$(grep '^DATABASE_URL=' apps/mockingbird/.env.preview | cut -d= -f2-) \
#      nx run mockingbird:prisma-deploy

# 4. Push to develop — Vercel auto-deploys
git push origin develop

# 5. Monitor Vercel build
vercel list                      # list recent deployments
vercel logs <deployment-url>     # tail logs if needed

# 6. Manual deploy (if auto-deploy didn't trigger or you need to deploy without pushing):
vercel deploy                    # deploys current branch as preview

# 7. Disable maintenance mode
vercel env rm MAINTENANCE_MODE preview --yes; echo "false" | vercel env add MAINTENANCE_MODE preview

# 8. Verify version deployed — check footer on sign-in page
#    Navigate to https://mockingbird.chrisstoy.com/auth/signin
#    The footer displays the app version (e.g. "v0.4.0").
#    Confirm it matches the version in apps/mockingbird/version.json.
cat apps/mockingbird/version.json   # shows expected version

# 9. Run E2E tests against pre-prod
PLAYWRIGHT_BASE_URL=https://mockingbird.chrisstoy.com nx run mockingbird-e2e:e2e
```

### Production Deploy (`main` → `mockingbird.club`)

E2E tests on pre-prod must pass before promoting to production.

```bash
# 1. Enable maintenance mode
vercel env rm MAINTENANCE_MODE production --yes 2>/dev/null; echo "true" | vercel env add MAINTENANCE_MODE production

# 2. Run DB migrations against production database (manual step — do BEFORE push)
vercel env pull /tmp/deploy-env --environment=production
DATABASE_URL=$(grep '^DATABASE_URL=' /tmp/deploy-env | cut -d= -f2- | tr -d '"') \
  npx prisma migrate deploy --schema=apps/mockingbird/prisma/schema.prisma
rm /tmp/deploy-env

# 3. Merge develop into main (via PR or direct merge after pre-prod sign-off)
git checkout main
git pull origin main
git merge develop
git push origin main

# 4. Vercel auto-deploys to production
# 5. Monitor build and verify at https://mockingbird.club
vercel logs <deployment-url>

# 6. Disable maintenance mode
vercel env rm MAINTENANCE_MODE production --yes; echo "false" | vercel env add MAINTENANCE_MODE production

# 7. Verify version deployed — check footer on sign-in page
#    Navigate to https://mockingbird.club/auth/signin
#    The footer displays the app version (e.g. "v0.4.0").
#    Confirm it matches the version in apps/mockingbird/version.json.
cat apps/mockingbird/version.json   # shows expected version

# 8. Post-deploy smoke test (see below)
```

#### Manual Production Deploy (if needed)

```bash
vercel deploy --prod
```

---

## Post-Deploy Verification

> **Status**: Formal checklist to be defined. Current approach is ad hoc.

Suggested manual smoke test after each production deploy:

- [ ] App loads at production URL without errors
- [ ] Version in footer of sign-in page matches `apps/mockingbird/version.json`
- [ ] Sign-in works (credentials + OAuth)
- [ ] Feed loads and displays posts
- [ ] Create a post (text + image upload)
- [ ] Friend request flow works
- [ ] Admin panel accessible at `/admin` for admin users
- [ ] Check Vercel function logs for unexpected errors

---

## Rollback

### Rollback via Vercel CLI

```bash
vercel rollback [deployment-id-or-url]   # rolls back to previous deployment
```

### Rollback via Git

```bash
# Revert the merge commit and push
git revert -m 1 <merge-commit-sha>
git push origin main
```

> If a migration was applied with breaking schema changes, a DB rollback must be coordinated separately (Prisma does not auto-rollback migrations). Assess impact before rolling back.

---

## Admin User Setup

To grant a user SUPER_ADMIN role, run the seed script against the target environment:

```bash
./scripts/make-admin.sh dev     <email>   # local dev
./scripts/make-admin.sh preview <email>   # pre-production
./scripts/make-admin.sh prod    <email>   # production
```

The script reads `DATABASE_URL` from the appropriate `.env.*` file and runs the Prisma seed.

---

## Environment Variable Management

Environment files are **not committed** — they live locally. Vercel holds the authoritative values for deployed environments.

| File                                   | Used By                                  |
| -------------------------------------- | ---------------------------------------- |
| `apps/mockingbird/.env.local`          | Local dev                                |
| `apps/mockingbird/.env.preview`        | Local scripts targeting preview DB       |
| `apps/mockingbird/.env.prod`           | Local scripts targeting prod DB          |
| `apps/mockingbird/.env.vercel.preview` | Reference for Vercel preview env vars    |
| `apps/mockingbird/.env.vercel.prod`    | Reference for Vercel production env vars |

To sync local env from Vercel:

```bash
vercel env pull apps/mockingbird/.env.local --environment=development
vercel env pull apps/mockingbird/.env.preview --environment=preview
vercel env pull apps/mockingbird/.env.prod --environment=production
```

To add/update a variable in Vercel:

```bash
vercel env add <NAME> production
vercel env add <NAME> preview
vercel env add <NAME> development
```

---

## Hotfix Process

For urgent production fixes that cannot wait for the normal `develop → main` flow:

```bash
# 1. Cut hotfix branch from main
git checkout main
git pull origin main
git checkout -b fix/hotfix-description

# 2. Make fix, commit, push
git push origin fix/hotfix-description

# 3. Open PR directly against main; get review
# 4. Merge to main after CI passes
# 5. Run DB migrations if needed
# 6. Verify production
# 7. Back-merge main into develop to keep branches in sync
git checkout develop
git merge main
git push origin develop
```

---

## Nx Cache Notes

- Nx caches build/test outputs locally. If you get unexpected stale results, bust the cache:
  ```bash
  nx run mockingbird:<target> --skip-nx-cache
  ```
- Nx remote caching (Nx Cloud) is not currently configured.
