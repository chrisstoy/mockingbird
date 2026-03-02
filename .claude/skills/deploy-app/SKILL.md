---
name: deploy-app
description: Build, migrate, and deploy the app to Vercel. Usage: /deploy-app prod | /deploy-app preview
---

# Deploy App

Build the project, run any pending database migrations, and publish to Vercel.

## Arguments

- `prod` — deploy to **production** from the `main` branch
- `preview` — deploy to **preview** from the `develop` branch

## Instructions

### 1. Parse the argument

Read the argument passed by the user (`prod` or `preview`). If the argument is missing or invalid, stop and tell the user:
> Usage: `/deploy-app prod` or `/deploy-app preview`

Set variables based on the argument:

| Argument  | Required branch | Vercel environment | Vercel deploy flag |
|-----------|-----------------|--------------------|--------------------|
| `prod`    | `main`          | `production`       | `--prod`           |
| `preview` | `develop`       | `preview`          | _(no flag)_        |

### 2. Verify current branch

Run:
```bash
git branch --show-current
```

- If the current branch does not match the required branch, **stop** and tell the user:
  > Cannot deploy: `prod` requires the `main` branch, `preview` requires the `develop` branch. Currently on `<current-branch>`.
- If the branch is correct, confirm and continue.

### 3. Check for uncommitted changes

Run:
```bash
git status --short
```

If there are uncommitted changes, **warn the user** and ask whether to proceed. Do not stop automatically — let the user decide.

### 4. Pull environment variables

Run from the repo root:
```bash
vercel env pull /tmp/deploy-env --environment=<environment>
```

Extract `DATABASE_URL` from `/tmp/deploy-env` for use in the migration step. Clean up the temp file after use.

### 5. Run database migrations

Run from `apps/mockingbird/`:
```bash
DATABASE_URL=<value> npx prisma migrate deploy
```

- Use `migrate deploy` (never `migrate dev`) — it only applies pending migrations and is safe for production/preview.
- If the error `P3005` appears ("database schema is not empty"), the `_prisma_migrations` table is missing. In that case:
  1. Baseline the initial migration:
     ```bash
     DATABASE_URL=<value> npx prisma migrate resolve --applied 0_init
     ```
  2. Re-run `migrate deploy`.
- Report how many migrations were applied (or confirm "no pending migrations").

### 6. Deploy to Vercel

Run from the repo root:
```bash
vercel deploy <flag>
```

Where `<flag>` is `--prod` for production or empty for preview.

Stream/display the build output. The build uses `npx nx run mockingbird:build-vercel` internally (configured in `vercel.json`).

### 7. Report result

On success, output:
- Deployment URL
- Inspect URL
- Number of migrations applied
- Any non-fatal warnings from the build (e.g., missing tables during static generation — these indicate a migration was needed and should now be resolved)

On failure, output the error and the step that failed.

## Notes

- `vercel.json` must have `"outputDirectory": "apps/mockingbird/.next"` — if the build succeeds but Vercel errors with "output directory not found", restore this field.
- Migrations run against the live database for the target environment — double-check the `DATABASE_URL` before proceeding on `prod`.
- The Vercel project must already be linked (`vercel link`) and the user must be authenticated (`vercel whoami`).
