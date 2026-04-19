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

## Step 3 — Verify Vercel auth and project link

```bash
vercel whoami
cat .vercel/project.json
```

Stop if not authenticated; tell the user to run `vercel login`.

The project must be linked to `mockingbird` (not `mockingbird-2`). If `project.json` shows `projectName: "mockingbird-2"` or is missing, re-link:
```bash
vercel link --scope team_OrZdpS2ROzUOdrEUR54NHWGK --project mockingbird --yes
```

## Step 4 — Verify version (`prod` only)

The version in `develop` is already set to the version being released — no bump needed here.

Confirm the version in `version.json` is correct before proceeding:
```bash
cat apps/mockingbird/version.json
```

Ask the user to confirm this is the intended release version. If it is wrong, stop and resolve it manually before continuing.

Skip this step for `preview` deploys.

## Step 5 — Enable maintenance mode

Maintenance mode is controlled via Edge Config — no redeploy needed. Use the environment-specific key:
- `preview` → key `previewMaintenanceMode`
- `production` → key `productionMaintenanceMode`

```bash
VERCEL_TOKEN=$(python3 -c "import json; print(json.load(open('/Users/cstoy/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
EC_KEY=<previewMaintenanceMode|productionMaintenanceMode>
curl -s -X PATCH "https://api.vercel.com/v1/edge-config/ecfg_v1w34seioecngzlhghvx3mupyzoo/items?teamId=team_OrZdpS2ROzUOdrEUR54NHWGK" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"operation\":\"upsert\",\"key\":\"$EC_KEY\",\"value\":true}]}"
```

## Step 6 — Run DB migrations

Follow the **Database Migrations** section of `SDLC.md`. Pull the URL from Vercel and apply pending migrations using `prisma migrate deploy` directly (never `migrate dev`, never `nx run mockingbird:prisma-deploy` — the nx target does not inherit the exported DATABASE_URL):

```bash
# preview — must include --git-branch=develop to get the correct DATABASE_URL
vercel env pull /tmp/deploy-env --environment=preview --git-branch=develop
# production
vercel env pull /tmp/deploy-env --environment=production

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
vercel list | head -8
vercel logs <deployment-url> --follow 2>&1
```

Note: `vercel list` does not support a `--limit` flag — use `| head -N` to truncate output.

The Vercel build runs `nx run mockingbird:build-vercel` (chains: `prisma-generate → update-build-date → build`). Watch for errors and report them.

**If the deployment shows `Canceled` with reason "Ignored Build Step"** (check via Vercel API if not obvious):
- `nx-ignore` has been disabled on the Vercel project, so this should not recur.
- If it does happen, force a redeploy of the last ready build via the API (do NOT use `vercel deploy --prod` — it uploads node_modules and exceeds the 100MB file limit):
```bash
VERCEL_TOKEN=$(python3 -c "import json; print(json.load(open('/Users/cstoy/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
LAST_READY=$(curl -s "https://api.vercel.com/v6/deployments?teamId=team_OrZdpS2ROzUOdrEUR54NHWGK&projectId=prj_LPsjXeMEqjYgm9gGvMINqgRWRIuu&limit=10&state=READY" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['deployments'][0]['uid'])")
curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=team_OrZdpS2ROzUOdrEUR54NHWGK&forceNew=1" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"mockingbird\",\"deploymentId\":\"$LAST_READY\",\"target\":\"production\"}" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('url'), d.get('readyState'))"
```

## Step 9 — Report result

On success report:
- Deployment URL
- Target environment URL
- Migrations applied (count or "none pending")
- Any non-fatal warnings

On failure report the error and which step failed.

## Step 10 — Disable maintenance mode

```bash
VERCEL_TOKEN=$(python3 -c "import json; print(json.load(open('/Users/cstoy/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
EC_KEY=<previewMaintenanceMode|productionMaintenanceMode>
curl -s -X PATCH "https://api.vercel.com/v1/edge-config/ecfg_v1w34seioecngzlhghvx3mupyzoo/items?teamId=team_OrZdpS2ROzUOdrEUR54NHWGK" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"operation\":\"upsert\",\"key\":\"$EC_KEY\",\"value\":false}]}"
```

## Step 11 — Verify version deployed

Check the sign-in page footer to confirm the correct version is live:

- **preview**: navigate to `https://mockingbird.chrisstoy.com/auth/signin`
- **prod**: navigate to `https://mockingbird.club/auth/signin`

The footer displays the app version (e.g. `v0.5.0`). Confirm it matches:
```bash
cat apps/mockingbird/version.json
```

## Step 12 — Post-deploy

**preview** — remind the user to run E2E tests before promoting to prod:
```bash
PLAYWRIGHT_BASE_URL=https://mockingbird.chrisstoy.com nx run mockingbird-e2e:e2e
```

**prod** — do NOT run automated E2E tests. Remind the user to run the smoke test checklist from `SDLC.md`:
- App loads at `mockingbird.club`
- Sign-in (credentials + OAuth)
- Feed loads and displays posts
- Create a post (text + image upload)
- Friend request flow
- Admin panel at `/admin`
- Check Vercel function logs for errors

## Step 13 — Bump develop to next version (`prod` only)

Now that the released version is on `main`, advance `develop` to the next MINOR version so preview always shows what's being built next.

**IMPORTANT: capture the shipping version BEFORE running bump-version**, because the skill will overwrite `version.json` with the next version:

```bash
# Capture BEFORE bump — this is what just shipped on main
SHIPPING_VERSION=$(node -p "require('./apps/mockingbird/version.json').version")
echo "Shipped: $SHIPPING_VERSION"
```

Run the `bump-version` skill in auto-minor mode — it will increment the MINOR component automatically without prompting:
```
/bump-version --auto-minor
```

After the skill completes, tag the shipped release and commit + push develop:
```bash
# Tag the version that shipped on main (captured before bump)
git tag v$SHIPPING_VERSION

# Commit the next-version bump on develop
git add apps/mockingbird/version.json CHANGELOG.md
git commit -m "chore: bump version to $(node -p "require('./apps/mockingbird/version.json').version")"
git push origin develop
git push origin v$SHIPPING_VERSION   # push the tag for the version that shipped
```

Remind the user to ensure the Jira release `$SHIPPING_VERSION` exists and all tickets are associated with it: https://stoy.atlassian.net/projects/MOC/versions

## Rollback

See the **Rollback** section of `SDLC.md`. Short version:
```bash
vercel rollback [deployment-id]          # fast, no code change
git revert -m 1 <merge-sha> && git push origin main  # git-based
```

> If maintenance mode is active during a rollback, disable it after the rollback completes.
> Migration rollbacks must be handled separately — Prisma does not auto-rollback.
