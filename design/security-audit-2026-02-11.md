# Mockingbird Security & Bug Audit

**Date**: 2026-02-11
**Branch**: develop (466672c)

---

## CRITICAL — Fix Immediately

**1. IDOR: Any user can delete any post**
`apps/mockingbird/src/app/api/posts/[postId]/route.ts` — DELETE validates auth but never checks the authenticated user owns the post.

**2. IDOR: Friend operations bypass authorization**
`apps/mockingbird/src/app/api/users/[userId]/friends/[friendId]/route.ts` — POST/PUT/DELETE all validate auth but never assert `session.user.id === userId`. Any user can accept/reject/send/delete friend requests on behalf of another user.

**3. Unauthenticated image listing**
`apps/mockingbird/src/app/api/users/[userId]/images/route.ts` — GET handler has no `validateAuthentication()` call; anyone can enumerate any user's images.

**4. IDOR: Can attempt to delete other users' images**
`apps/mockingbird/src/app/api/images/[imageId]/route.ts` — Ownership is only enforced at the service layer via an exception, not with a clean 403 in the route.

---

## HIGH

**5. Friends list visible to anyone (no ownership check)**
`apps/mockingbird/src/app/api/users/[userId]/friends/route.ts` — GET authenticates but returns any user's friends regardless of who is asking.

**6. Error responses leak internals**
`apps/mockingbird/src/app/api/errors.ts` — Full error name/message returned in responses in production.

**7. Unbounded `limit` param on comments (potential DoS)**
`apps/mockingbird/src/app/api/posts/[postId]/comments/route.ts` — No bounds checking; parsed with `parseInt` with no max.

**8. User emails logged**
`apps/mockingbird/src/app/auth/localCredentials.ts` — Emails and expiry timestamps written to logs.

---

## MEDIUM

**9. Race condition in friend request flow**
`apps/mockingbird/src/app/api/users/[userId]/friends/[friendId]/route.ts` — Check-then-act pattern; should use a transaction.

**10. Form field name mismatch for album upload**
`apps/mockingbird/src/app/api/users/[userId]/images/route.ts` — Code reads `formData.get('album')` but schema expects `albumId`. Album association always silently fails.

**11. Unbounded `getPublicFeed()` query**
`apps/mockingbird/src/app/api/users/[userId]/feed/route.ts` — No pagination cap on public feed; could exhaust memory.

**12. Unsafe type cast in friends service**
`apps/mockingbird/src/app/api/users/[userId]/friends/route.ts` — `as unknown as string[]` bypasses type safety silently.

---

## LOW

**13. Weak CORS origin check in middleware**
`apps/mockingbird/middleware.ts` — `origin.includes(o)` allows bypass; use strict equality `origin === o`.

**14. Wrong HTTP status on authz failure**
`apps/mockingbird/src/app/api/posts/route.ts` — Returns 400 for ownership mismatch; should be 403.

**15. `dangerouslySetInnerHTML` in test component**
`apps/mockingbird/src/app/(routes)/test/_components/TestEditor.client.tsx:61` — XSS risk if test route is accessible in prod.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4     |
| High     | 4     |
| Medium   | 4     |
| Low      | 3     |
| **Total**| **15**|

**Fix priority:** Issues 1–4 (IDOR vulnerabilities) first — they allow cross-user data manipulation. Issue 10 is a silent bug causing lost functionality (album upload broken).
