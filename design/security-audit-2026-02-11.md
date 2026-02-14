# Mockingbird Security & Bug Audit

**Date**: 2026-02-11
**Branch**: develop (466672c)

---

---

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

| Severity  | Count  |
| --------- | ------ |
| Critical  | 4      |
| High      | 4      |
| Medium    | 4      |
| Low       | 3      |
| **Total** | **15** |

**Fix priority:** Issues 1–4 (IDOR vulnerabilities) first — they allow cross-user data manipulation. Issue 10 is a silent bug causing lost functionality (album upload broken).
