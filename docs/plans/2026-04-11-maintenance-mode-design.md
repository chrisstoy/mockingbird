# Maintenance Mode Design (MOC-83)

## Overview

Display a maintenance screen to all users when `MAINTENANCE_MODE=true` is set as a Vercel environment variable. The check runs before authentication so every visitor — authenticated or not — is blocked. Toggling the env var and redeploying is the only mechanism; no admin UI or database flag is involved.

## Requirements

- All users (authenticated and unauthenticated) see the maintenance screen
- No bypass for any user or role
- UI pages redirect to `/maintenance`
- API routes return HTTP 503 JSON
- `/api/health` returns HTTP 200 `{ status: "maintenance" }` during maintenance
- Static assets pass through unaffected
- Maintenance page matches app visual style (AuthShell + logo)

## Architecture

### Middleware (`apps/mockingbird/middleware.ts`)

New file at the app root. Runs on every request before NextAuth fires.

**Pass-through paths** (never intercepted):
- `/_next/`
- `/icons/`
- `/images/`
- `/manifest.webmanifest`
- `/favicon`
- `/maintenance`

**When `MAINTENANCE_MODE !== 'true'`**: all requests pass through normally.

**When `MAINTENANCE_MODE === 'true'`**:
- `/api/health` → `200 { status: "maintenance" }`
- `/api/*` → `503 { error: "Service temporarily unavailable - maintenance in progress" }`
- Everything else → redirect to `/maintenance`

Reads `process.env.MAINTENANCE_MODE` directly (not via `env.ts`) — acceptable for middleware edge context.

### Maintenance Page

**`src/app/maintenance/layout.tsx`** — wraps content in `AuthShell` (same layout as signin, error pages).

**`src/app/maintenance/page.tsx`** — static server component:
- Mockingbird logo (96×96, `next/image`)
- "Down for Maintenance" heading + "We'll be back shortly" subheading
- `alert alert-warning` with `WrenchScrewdriverIcon` and message

No interactive elements. No sign-in link.

### Env Var

**`env.ts`** — add to server schema:
```ts
MAINTENANCE_MODE: z.enum(['true', 'false']).optional(),
```

Optional so unset = normal operation.

## SDLC Integration

Maintenance mode is toggled manually via Vercel CLI as part of the production deploy runbook:

```bash
# 1. Enable before deploying
vercel env add MAINTENANCE_MODE production   # value: "true"

# 2. Run production deploy / migration

# 3. Disable after deploy completes
vercel env rm MAINTENANCE_MODE production
vercel redeploy --prod
```

## Files Changed

| File | Action |
|------|--------|
| `apps/mockingbird/middleware.ts` | Create |
| `apps/mockingbird/src/app/maintenance/layout.tsx` | Create |
| `apps/mockingbird/src/app/maintenance/page.tsx` | Create |
| `apps/mockingbird/env.ts` | Add `MAINTENANCE_MODE` to server schema |
