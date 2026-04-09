---
name: deploy-app
description: Deploy the app to Vercel following the project's SDLC process — run DB migrations, push the branch, and monitor the deployment. Use this skill whenever the user wants to deploy, ship, push to Vercel, promote to production, or deploy a preview. Triggers on "deploy", "ship it", "push to prod/preview", "promote to main", etc.
---

# Deploy App

> **Source of truth**: `SDLC.md` in the repo root. Follow it exactly. This skill is an executor — it parses the argument and runs the SDLC steps in order.

## Step 1 — Parse argument

Accept `preview` or `prod` from the user. If missing or invalid, stop and print:
> Usage: `/deploy-app prod` or `/deploy-app preview`

| Argument  | Vercel environment | Target URL                       | Branch op                     |
|-----------|--------------------|----------------------------------|-------------------------------|
| `preview` | preview            | `mockingbird.chrisstoy.com`      | push `develop`                |
| `prod`    | production         | `mockingbird.club`               | merge `develop → main`        |

## Step 2 — Verify repo state

```bash
git branch --show-current
git status --short
```

- Must be on `develop` for both targets. Stop if not.
- If uncommitted changes exist, warn the user and ask whether to proceed.
- Run lint and tests; stop if either fails:
  ```bash
  nx run mockingbird:lint
  nx run mockingbird:test
  ```

## Step 3 — Verify Vercel auth

```bash
vercel whoami
```

Stop if not authenticated; tell the user to run `vercel login`.

## Step 4 — Bump version (`prod` only)

First, pull the latest develop to ensure version bump is on current state:
```bash
git pull origin develop
```

Run the `bump-version` skill to update `version.json` and `CHANGELOG.md`:

```
/bump-version
```

After the skill completes, commit, tag, and push develop:
```bash
git add apps/mockingbird/version.json CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin develop
git push origin vX.Y.Z
```

Skip this step for `preview` deploys.

## Step 5 — Enable maintenance mode

```bash
vercel env rm MAINTENANCE_MODE <preview|production> --yes 2>/dev/null
echo "true" | vercel env add MAINTENANCE_MODE <preview|production>
```

## Step 6 — Run DB migrations

Follow the **Database Migrations** section of `SDLC.md`. Pull the URL from Vercel and apply pending migrations using `prisma migrate deploy` (never `migrate dev`):

```bash
vercel env pull /tmp/deploy-env --environment=<preview|production>
DATABASE_URL=$(grep '^DATABASE_URL=' /tmp/deploy-env | cut -d= -f2- | tr -d '"') \
  npx prisma migrate deploy --schema=apps/mockingbird/prisma/schema.prisma
rm /tmp/deploy-env
```

Report how many migrations were applied, or confirm none were pending.

## Step 7 — Push branch (triggers auto-deploy)

Follow the **Deployment** section of `SDLC.md`.

**preview:**
```bash
git pull origin develop
git push origin develop
```

**prod:**
```bash
git pull origin develop
git checkout main
git pull origin main
git merge develop
git push origin main
git checkout develop
```

If `git push` reports "Everything up-to-date" and no auto-deploy triggers, fall back to a manual deploy:
```bash
vercel deploy          # preview
vercel deploy --prod   # prod
```

## Step 8 — Monitor

```bash
vercel list
vercel logs <deployment-url> --follow
```

The Vercel build runs `nx run mockingbird:build-vercel` (chains: `prisma-generate → update-build-date → build`). Watch for errors and report them.

## Step 9 — Report result

On success report:
- Deployment URL
- Target environment URL
- Migrations applied (count or "none pending")
- Any non-fatal warnings

On failure report the error and which step failed.

## Step 10 — Disable maintenance mode

```bash
vercel env rm MAINTENANCE_MODE <preview|production> --yes
echo "false" | vercel env add MAINTENANCE_MODE <preview|production>
```

## Step 11 — Post-deploy

**preview** — remind the user to run E2E tests before promoting to prod:
```bash
PLAYWRIGHT_BASE_URL=https://mockingbird.chrisstoy.com nx run mockingbird-e2e:e2e
```

**prod** — E2E tests against pre-prod must pass before this step is considered complete. If not already run, stop and run them now:
```bash
PLAYWRIGHT_BASE_URL=https://mockingbird.chrisstoy.com nx run mockingbird-e2e:e2e
```
Do not proceed past this point if E2E tests fail.

Then remind the user to run the smoke test checklist from `SDLC.md`:
- App loads at `mockingbird.club`
- Sign-in (credentials + OAuth)
- Feed loads and displays posts
- Create a post (text + image upload)
- Friend request flow
- Admin panel at `/admin`
- Check Vercel function logs for errors

## Rollback

See the **Rollback** section of `SDLC.md`. Short version:
```bash
vercel rollback [deployment-id]          # fast, no code change
git revert -m 1 <merge-sha> && git push origin main  # git-based
```

> If maintenance mode is active during a rollback, disable it after the rollback completes.
> Migration rollbacks must be handled separately — Prisma does not auto-rollback.
