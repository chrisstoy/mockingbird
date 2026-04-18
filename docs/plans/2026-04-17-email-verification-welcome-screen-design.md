# Email Verification Welcome Screen

**Date:** 2026-04-17
**Branch:** MOC-89-Support-time-limit-for-creating-account

## Summary

After a user clicks the email verification link, redirect them to a welcome screen instead of directly to `/`. The welcome screen shows a brief confirmation message and a "Sign In" button that takes them to the sign-in page with their email pre-filled.

## Data Flow

1. User clicks verification link → `GET /api/auth/verify-email?token=<token>`
2. API route validates token, updates user to `emailVerified + status=ACTIVE`, fetches email from update result
3. Redirects to `/auth/welcome?email=<encoded-email>`
4. Welcome page renders (public route — no auth required)
5. User clicks "Sign In" → `/auth/signin?email=<email>`
6. Sign-in page pre-fills email field

## Components

### 1. `src/app/api/auth/verify-email/route.ts`
- Add `select: { email: true }` to `prisma.user.update`
- Change redirect from `/` to `/auth/welcome?email=<encodeURIComponent(email)>`
- Fallback: if no email returned, redirect to `/auth/welcome` (no pre-fill)

### 2. `src/app/auth/welcome/page.tsx` *(new)*
- Server component
- Reads `searchParams.email`
- Renders: heading, subtext, `<Link>` styled as `btn btn-primary` to `/auth/signin?email=<email>`
- Uses existing `auth` layout for consistent card styling

### 3. `src/app/auth/index.ts`
- Add `/auth/welcome` to the public-routes allowlist in the `authorized` callback

### 4. `src/app/auth/signin/_components/SignInEmailPassword.client.tsx`
- Add optional `defaultEmail` prop → `defaultValue` on email input
- `SignInPage` reads `searchParams.get('email')` and passes it down

## Error Handling

- Invalid/missing token: existing `?error=invalid` redirect unchanged
- Missing email from DB (edge case): welcome page renders without pre-fill; sign-in button goes to `/auth/signin`

## Testing

- Manual smoke test: full registration → verify-email → welcome → sign-in path
- Existing `login.spec.ts` e2e covers sign-in flow

## Task IDs

- T1: Explore project context (completed)
- T2: Clarifying questions (completed)
- T3: Propose approaches (completed)
- T4: Design approval (completed)
- T5: Write design doc (this)
- T6: Implementation plan
