# Admin Web App Features

The admin panel is at `src/app/(admin)/admin/`. It has its own layout with a sidebar nav and is entirely permission-gated. Admin pages are Server Components that call `validatePermission()` directly. All admin routes require at minimum `admin:access`.

---

## Feature Inventory

| Feature | Status | Route | Permission | Notes |
|---|---|---|---|---|
| Dashboard | Complete | `/admin` | `admin:access` | User count, post count, recent audit log entries (last 10) |
| User list | Complete | `/admin/users` | `users:view` | Paginated table; search by name/email; shows role badge, status badge, join date |
| User detail | Complete | `/admin/users/[userId]` | `users:view` | Full user info + all management controls |
| Change user role | Complete | `/admin/users/[userId]` | `users:edit` | Dropdown: USER → MODERATOR → EDITOR → SUPER_ADMIN; logged to audit log |
| Suspend user | Complete | `/admin/users/[userId]` | `users:suspend` | Requires reason text; sets `status = SUSPENDED` |
| Unsuspend user | Complete | `/admin/users/[userId]` | `users:suspend` | Sets `status = ACTIVE` |
| Delete user | Complete | `/admin/users/[userId]` | `users:delete` | Confirmation required |
| Permission overrides | Complete | `/admin/users/[userId]` | `users:permissions` | Grant/revoke individual permissions regardless of role |
| Content moderation | Complete | `/admin/content` | `posts:view_all` | Paginated list of all posts; delete any post (logged) |
| Document management | Complete | `/admin/documents` | `documents:create` | View all TOC + PRIVACY document versions; create new versions |
| System log viewer | Complete | `/admin/logs` | `system:logs` | Reads Winston log files from `LOG_DIR`; filter by date and log level |
| Audit log | Complete | `/admin/audit` | `admin:access` | Paginated list of all admin actions from `AdminAuditLog` table |

---

## Page Structure

All admin pages live under `src/app/(admin)/admin/` and use the admin layout at `(admin)/admin/layout.tsx` (sidebar navigation).

| Route | Component file |
|---|---|
| `/admin` | `(admin)/admin/page.tsx` |
| `/admin/users` | `(admin)/admin/users/page.tsx` |
| `/admin/users/[userId]` | `(admin)/admin/users/[userId]/page.tsx` |
| `/admin/content` | `(admin)/admin/content/page.tsx` |
| `/admin/documents` | `(admin)/admin/documents/page.tsx` |
| `/admin/documents/[docType]/new` | `(admin)/admin/documents/[docType]/new/page.tsx` |
| `/admin/logs` | `(admin)/admin/logs/page.tsx` |
| `/admin/audit` | `(admin)/admin/audit/page.tsx` |

Client components for interactive controls live in `_components/` subdirectories under each section (e.g., `(admin)/admin/users/_components/UserAdminControls.client.tsx`).

---

## Permission Reference

```
SUPER_ADMIN: all permissions
MODERATOR:   admin:access, users:view, users:suspend, posts:view_all, posts:delete
EDITOR:      admin:access, documents:create
USER:        (none — no admin access)
```

All permissions: `admin:access`, `users:view`, `users:edit`, `users:suspend`, `users:delete`, `users:permissions`, `posts:view_all`, `posts:delete`, `system:logs`, `documents:create`

Per-user overrides can grant or revoke any permission regardless of role. Computed via `computePermissions(role, overrides)` in `_types/permissions.ts` and stored in the JWT.

---

## Key Business Rules

### Audit Logging
Every consequential admin action (role change, suspension, post deletion, etc.) MUST be logged via `logAdminAction()` in `_server/adminService.ts`. Never skip this. Audit log is append-only.

```ts
await logAdminAction({
  actorId: session.user.id,
  action: 'DELETE_POST',
  targetId: postId,
  metadata: { ... } as Prisma.InputJsonValue, // or Prisma.JsonNull
});
```

### Sidebar Navigation Visibility
Nav items are only shown if the current user has the required permission. The layout reads permissions from the session JWT — no additional DB query needed.

### Admin User Management Flow
1. View users list → search by name/email
2. Click user → detail page with `UserAdminControls` client component
3. Controls: role selector, suspend/unsuspend with reason, delete, permission override table
4. All mutations call admin API endpoints and refresh the page/component on success

### Document Versioning
- Documents are versioned — each new upload creates a new version (int, auto-incremented per type)
- `User.acceptedToS` stores the `DocumentId` of the specific version they accepted
- TOS re-acceptance is required if a new TOC document version is published (logic in auth middleware)
