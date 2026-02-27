# Auth System & TOS Acceptance — Deep Dive

## Key Files

| File | Role |
|------|------|
| `src/app/auth/index.ts` | NextAuth config: JWT, session, authorized callbacks |
| `src/app/auth/auth.config.ts` | Provider list (GitHub, Google, LocalCredentials) |
| `src/app/auth/localCredentials.ts` | Credentials provider + `authorize()` |
| `src/app/auth/signin/page.tsx` | Sign-in page (client component) |
| `src/app/auth/tos/page.tsx` | TOS page (server component) |
| `src/app/(routes)/privacy/tos/_components/TOSViewer.client.tsx` | TOS UI + accept button |
| `src/app/auth/create-account/_components/CreateAccountForm.client.tsx` | Account creation form |
| `src/_types/permissions.ts` | `computePermissions(role, overrides)` |
| `src/_types/ids.ts` | `UserIdSchema`, `DocumentIdSchema` (10–255 char strings) |

---

## JWT Token Claims

Set in the `jwt` callback in `auth/index.ts`:

| Claim | Source | Notes |
|-------|--------|-------|
| `token.sub` | Explicitly set: `token.sub = user.id` on sign-in | v5 beta does NOT auto-set for Credentials provider |
| `token.id` | `user?.id ?? token.sub` | Custom claim, mirrors `sub` |
| `token.permissions` | `computePermissions(dbUser.role, dbUser.permissionOverrides)` | Recomputed on sign-in and update |
| `token.status` | `dbUser.status` | ACTIVE / SUSPENDED / DELETED |
| `token.requiresTOS` | DB check: `!dbUser.acceptedToS \|\| latestTos.id !== dbUser.acceptedToS` | Re-checked on every request when true |

### JWT Callback Branches

```
if (account || trigger === 'update')   → sign-in or explicit session update
  sets token.sub, token.id, token.permissions, token.status, token.requiresTOS from DB

else if (token.requiresTOS === true)   → every request while TOS pending
  re-reads DB using token.id || token.sub
  self-corrects requiresTOS without relying on update() cookie persistence
  (update() is unreliable in NextAuth v5 beta)

else                                   → normal request, nothing to do
```

**Critical**: `token.sub` must be explicitly set on sign-in (`token.sub = user.id`) because NextAuth v5 beta does not auto-set it for the Credentials provider. Without this, the `else-if` re-check branch cannot find the userId and silently skips the DB query — leaving `requiresTOS: true` forever.

---

## Session Callback

```typescript
session.user.id = (token?.id as string) || token?.sub || user?.id;
session.user.permissions = (token.permissions as string[]) ?? [];
session.user.status = (token.status as string) ?? 'ACTIVE';
session.user.requiresTOS = (token.requiresTOS as boolean) ?? false;
```

With JWT strategy, `user` is always `undefined` in the session callback.

---

## Middleware (authorized callback)

Evaluated on every request. Order matters:

1. **Public routes** — always allowed: `/auth/create-account`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/expired-password`, `/images/*`, `/api/*`
2. **Unauthenticated** → `return false` (redirects to sign-in)
3. **SUSPENDED** → redirect to `/account/suspended`
4. **requiresTOS** and not already at `/auth/tos` → redirect to `/auth/tos?requireAcceptance=true&userId=<id>`
5. **Admin routes** → check `admin:access` permission
6. Otherwise → `return true`

`userId` is included in the TOS redirect URL so `TOSViewer` can accept without relying on session.

---

## TOS Acceptance Flow

### Path A: Account Creation (CreateAccountForm)
1. POST `/api/users` to create user
2. `signIn('credentials', { callbackUrl: '/' })` — **redirect: true** (default)
3. NextAuth redirects to `/` → middleware intercepts → redirects to `/auth/tos?requireAcceptance=true&userId=<id>`
4. TOS page (server component) reads `userId` from query param
5. User clicks "Accept Terms" → `TOSViewer.handleAccept()` fires
6. `acceptTOS(userId, tosId)` → PUT `/api/users/:userId/tos/:tosId`
7. `update()` → triggers JWT callback with `trigger='update'` → re-reads DB → `requiresTOS: false`
8. `router.replace('/')` → next request's JWT `else-if` branch also self-corrects if cookie wasn't updated
9. Middleware allows through to `/`

### Path B: Sign-In Page (existing user)
1. `signIn('credentials', { redirect: false })` — explicit
2. On success: `update()` → check `requiresTOS` from session
3. If required: `router.push('/auth/tos?requireAcceptance=true&newTOS=...&userId=<id>')`
4. Same acceptance flow as steps 5–9 above

### TOSViewer.handleAccept() — silent failure guard
```typescript
async function handleAccept() {
  const { data: tosId } = DocumentIdSchema.safeParse(rawTOSId);
  const { data: userId } = UserIdSchema.safeParse(rawUserId);
  if (userId && tosId) {          // ← silently no-ops if either is undefined
    await acceptTOS(userId, tosId);
    await update();
    router.replace('/');
  }
}
```
Both `userId` and `tosId` must pass the 10–255 char schema validation. If either is undefined (e.g. userId missing from URL and not in session), the function does nothing with no UI feedback.

### TOS Page userId Resolution (server component)
```typescript
const userId =
  searchParams?.userId ??              // from URL (middleware redirect or sign-in page)
  UserIdSchema.safeParse(session?.user?.id).data;  // fallback to session
```

---

## Credentials Provider (localCredentials.ts)

`authorize()` checks in order:
1. Email + password present (else throws `emailAndPasswordRequired`)
2. User exists by email (else `userNotFound`)
3. Password record exists (else `passwordNotFound`)
4. `bcrypt.compare` passes (else `invalidPassword`)
5. `existingPassword.expiresAt < new Date()` → throws `passwordExpired`
6. Returns Prisma `user` object

The sign-in page handles `passwordExpired` specially → redirects to `/auth/expired-password`.

Error codes → user-facing messages are mapped in `signin/page.tsx`'s `ERROR_MESSAGES` object.

---

## Known Quirks / Gotchas

- **NextAuth v5 beta `update()` unreliable**: Cookie may not be updated after `update()` call. The `else-if` DB re-check in the JWT callback is the safety net.
- **`token.sub` not auto-set for Credentials**: Must explicitly set `token.sub = user.id` in the JWT callback on sign-in.
- **`Passwords` table has no cascade delete**: Deleting a `User` via `/api/test/delete-user` leaves orphaned `Passwords` rows (not a production concern since the test endpoint handles cleanup for e2e).
- **TOS document type is `'TOC'`** (not `'TOS'`) in the `Document` table.
- **`token.requiresTOS` re-check fires on every request** while true — this has a DB cost but ensures correctness.
- **Serial e2e tests**: `login.spec.ts` uses `test.describe.configure({ mode: 'serial' })` — a failure in "create new user" skips "delete user". `forceDeleteTestUser()` runs in `beforeAll`/`afterAll` for cleanup.
