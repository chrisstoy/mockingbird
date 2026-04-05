---
name: deploy-app
description: Deploy the app to Vercel following the project's SDLC process — run DB migrations, push the branch, and monitor the deployment. Use this skill whenever the user wants to deploy, ship, push to Vercel, promote to production, or deploy a preview. Triggers on "deploy", "ship it", "push to prod/preview", "promote to main", etc.
---

# Deploy App

Deploy the Mockingbird app to Vercel following the SDLC process: run migrations, push the branch to trigger an auto-deploy, then monitor.

## Arguments

- `prod` — promote `develop → main` and deploy to **production** (`mockingbird.club`)
- `preview` — deploy `develop` to **pre-production** (`mockingbird.chrisstoy.com`)

## Instructions

### 1. Parse the argument

Read the argument passed by the user (`prod` or `preview`). If missing or invalid, stop:
> Usage: `/deploy-app prod` or `/deploy-app preview`

| Argument  | Branch operation                  | Vercel environment | Target URL                       |
|-----------|-----------------------------------|--------------------|----------------------------------|
| `preview` | push `develop`                    | preview            | `mockingbird.chrisstoy.com`      |
| `prod`    | merge `develop → main`, push `main` | production       | `mockingbird.club`               |

### 2. Verify branch and repo state

```bash
git branch --show-current
git status --short
```

- For `preview`: must be on `develop`. If not, stop and tell the user.
- For `prod`: must be on `develop` (the merge to `main` happens in step 5). If not, stop.
- If there are uncommitted changes, warn and ask whether to proceed.

### 3. Verify prerequisites

```bash
vercel whoami
```

If not authenticated, tell the user to run `vercel login`. The project must already be linked (`vercel link`).

### 4. Run database migrations

Pull the `DATABASE_URL` for the target environment and apply pending migrations. Never use `migrate dev` outside of local development.

```bash
vercel env pull /tmp/deploy-env --environment=<environment>
DATABASE_URL=$(grep '^DATABASE_URL=' /tmp/deploy-env | cut -d= -f2- | tr -d '"') \
  npx prisma migrate deploy --schema=apps/mockingbird/prisma/schema.prisma
rm /tmp/deploy-env
```

- Use `<environment>` = `preview` or `production` to match the argument.
- If `P3005` error appears ("database schema is not empty"), the migrations table is missing. Baseline and retry:
  ```bash
  DATABASE_URL=<value> npx prisma migrate resolve --applied 0_init
  # then re-run migrate deploy
  ```
- Report how many migrations were applied (or confirm "no pending migrations").

> Migrations run against the live database — double-check `DATABASE_URL` before proceeding on `prod`.

### 5. Push the branch (triggers auto-deploy)

Vercel auto-deploys when the mapped branch is pushed. This is the preferred deploy path.

**For `preview`:**
```bash
git push origin develop
```

**For `prod`:**
```bash
git checkout main
git pull origin main
git merge develop
git push origin main
git checkout develop   # return to develop
```

### 6. Monitor the deployment

```bash
vercel list            # find the deployment URL
vercel logs <deployment-url> --follow
```

Watch for build errors. The Vercel build runs `npx nx run mockingbird:build-vercel` internally (configured in `vercel.json`), which chains: `prisma-generate → update-build-date → build`.

If auto-deploy didn't trigger (e.g., no new commits), fall back to a manual deploy:
```bash
# preview
vercel deploy
# prod
vercel deploy --prod
```

### 7. Report result

On success, output:
- Deployment URL
- Target environment URL (`mockingbird.chrisstoy.com` or `mockingbird.club`)
- Number of migrations applied
- Any non-fatal build warnings

On failure, output the error and the step that failed.

## Post-deploy verification

After `prod`, remind the user to run the smoke test:
- App loads at `mockingbird.club` without errors
- Sign-in works (credentials + OAuth)
- Feed loads and displays posts
- Create a post (text + image upload)
- Friend request flow works
- Admin panel accessible at `/admin`
- Check Vercel function logs for unexpected errors

For `preview`, E2E tests should pass before promoting to production:
```bash
PLAYWRIGHT_BASE_URL=https://mockingbird.chrisstoy.com nx run mockingbird-e2e:e2e
```

## Rollback

If a production deploy needs to be reverted:

```bash
# Option 1: Vercel rollback (fast, no code change)
vercel rollback [deployment-id-or-url]

# Option 2: Git revert (if code change is needed)
git revert -m 1 <merge-commit-sha>
git push origin main
```

> If a migration was applied with breaking schema changes, a DB rollback must be coordinated separately — Prisma does not auto-rollback migrations.

## Notes

- `vercel.json` must have `"outputDirectory": "apps/mockingbird/.next"` — if the build succeeds but Vercel errors with "output directory not found", restore this field.
- Direct commits to `main` are not allowed except for hotfixes. The `prod` argument always merges from `develop`.
- E2E tests on pre-prod must pass before promoting to production.
