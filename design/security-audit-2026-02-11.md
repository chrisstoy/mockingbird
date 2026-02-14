# Mockingbird Security & Bug Audit

**Date**: 2026-02-11
**Branch**: develop (466672c)

---

---

---

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
