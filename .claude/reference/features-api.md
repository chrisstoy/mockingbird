# Backend / API Features

The API is a Next.js App Router API layer at `src/app/api/`. All business logic lives in `src/_server/` services. See [api-contracts.md](api-contracts.md) for full request/response shapes.

---

## Feature Inventory

| Feature | Status | Endpoint(s) | Notes |
|---|---|---|---|
| Health check | Complete | `GET /api/health` | No auth; returns `{ ok: true }` |
| Account registration | Complete | `POST /api/users` | Turnstile CAPTCHA required (bypassed localhost); creates user with `PENDING_EMAIL_VERIFICATION` status |
| Email verification | Complete | `GET /api/auth/verify-email?token=` | Token consumed → status set to `ACTIVE` |
| Resend email verification | Complete | `POST /api/auth/resend-verification` | Only for `PENDING_EMAIL_VERIFICATION` users |
| Sign in (OAuth) | Complete | `GET/POST /api/auth/[...nextauth]` | GitHub + Google via NextAuth v5 |
| Sign in (credentials) | Complete | `POST /api/auth/[...nextauth]` | Email + password; checks `Passwords` table; expired password triggers change flow |
| Password reset (initiate) | Complete | `POST /api/auth/forgot-password` | Always returns 200 (email enumeration protection); token expires 24h |
| Password reset (complete) | Complete | `POST /api/auth/reset-password` | Validates token (single-use); sets new password |
| Password change (authenticated) | Complete | `POST /api/users/[userId]/password` | Requires current password; new must differ |
| Expired password change | Complete | `POST /api/auth/change-expired-password` | Triggered on login when `Passwords.expiresAt < now` |
| TOS acceptance | Complete | `PUT /api/users/[userId]/tos/[tosId]` | Sets `User.acceptedToS = tosId`; initiates email verification |
| Feed (public) | Complete | `GET /api/users/[userId]/feed?feed=public` | PUBLIC top-level posts from self + friends; cursor pagination |
| Feed (private) | Complete | `GET /api/users/[userId]/feed?feed=private` | All top-level posts from self + friends; no cursor pagination |
| Custom feed sources | Stub | `FeedSourceSchema` accepts cuid2 | `feedService.getFeed()` throws for anything other than `public`/`private` |
| Create post | Complete | `POST /api/posts` | Audience: PUBLIC or PRIVATE; optional `imageId` |
| Get post | Complete | `GET /api/posts/[postId]` | |
| Delete post | Complete | `DELETE /api/posts/[postId]` | Owner OR `posts:delete` permission; cascades to comments |
| List comments | Complete | `GET /api/posts/[postId]/comments` | Optional `limit` param |
| Add comment | Complete | `POST /api/posts/[postId]/comments` | `posterId` must equal session user; inherits parent audience |
| Post reactions | Complete | `PUT /api/posts/[postId]/reactions`, `DELETE /api/posts/[postId]/reactions` | Six types (THUMBS_UP, THUMBS_DOWN, CHEER, ANGER, LAUGH, HUGS); one reaction per user; upsert replaces existing; users can see reactor names |
| Search users | Complete | `GET /api/users?q=` | Name + email partial match, case-insensitive |
| Get user profile | Complete | `GET /api/users/[userId]` | |
| Update profile image | Complete | `PATCH /api/users/[userId]` | Self only; updates `User.image` URL |
| Delete account | Complete | `DELETE /api/users/[userId]` | Self OR `users:delete` permission |
| List friends | Complete | `GET /api/users/[userId]/friends` | Returns `{ friends, pendingFriends, friendRequests }` |
| Send friend request | Complete | `PUT /api/users/[userId]/friends/[friendId]` | Creates `Friends` row with `accepted: false` |
| Accept/reject friend request | Complete | `POST /api/users/[userId]/friends/[friendId]` | Body: `{ accepted: boolean }` |
| Remove friend | Complete | `DELETE /api/users/[userId]/friends/[friendId]` | |
| Upload image | Complete | `POST /api/users/[userId]/images` | File or external URL; R2 storage; thumbnail auto-generated; max 2MB |
| List images | Complete | `GET /api/users/[userId]/images` | |
| Delete image | Complete | `DELETE /api/images/[imageId]` | Owner only; sets `Post.imageId = null` on referencing posts |
| Image albums | Partial | `GET /api/users/[userId]/albums` | Albums can be created; albumId optional on upload |
| Get latest document | Complete | `GET /api/documents/[docType]/latest` | No auth required; docType: `TOC` or `PRIVACY` |
| Get document by version | Complete | `GET /api/documents/[docType]/[version]` | |
| Create document | Complete | `POST /api/documents/[docType]` | Requires `documents:create` permission |
| Admin: list users | Complete | `GET /api/admin/users` | `users:view` permission |
| Admin: get user | Complete | `GET /api/admin/users/[userId]` | `users:view` permission |
| Admin: change user role | Complete | `PUT /api/admin/users/[userId]` | `users:edit` permission; logged to audit log |
| Admin: delete user | Complete | `DELETE /api/admin/users/[userId]` | `users:delete` permission |
| Admin: suspend user | Complete | `POST /api/admin/users/[userId]/suspend` | `users:suspend` permission |
| Admin: unsuspend user | Complete | `DELETE /api/admin/users/[userId]/suspend` | `users:suspend` permission |
| Admin: get permissions | Complete | `GET /api/admin/users/[userId]/permissions` | `users:permissions` permission |
| Admin: set permissions | Complete | `PUT /api/admin/users/[userId]/permissions` | `users:permissions` permission |
| Admin: list posts | Complete | `GET /api/admin/posts` | `posts:view_all` permission |
| Admin: delete post | Complete | `DELETE /api/admin/posts/[postId]` | `posts:delete` permission; logged to audit log |
| Admin: audit log | Complete | `GET /api/admin/audit` | `admin:access` permission; paginated |
| Admin: system logs | Complete | `GET /api/admin/logs` | `system:logs` permission; reads Winston log files from `LOG_DIR` |

---

## Key Business Rules

### Access Control
- All endpoints require `validateAuthentication()` except: `POST /api/users`, `GET /api/documents/[docType]/latest`, all `/api/auth/*`
- `posterId` in request body MUST equal `session.user.id` — routes assert this manually (403 if mismatch)
- Admin endpoints use `validatePermission('permission:name')` — see [api-contracts.md](api-contracts.md)

### Posts & Comments
- `Post.responseToPostId = null` → top-level post; non-null → comment
- Comments inherit the audience of their parent post
- Deleting a post cascades and deletes all its comments (`onDelete: Cascade`)
- No nesting: comments cannot have sub-comments

### Feed
- Public feed: PUBLIC posts only, from self + accepted friends (not all users globally)
- Private feed: all posts (PUBLIC + PRIVATE) from self + accepted friends
- Both feeds exclude comments — always filter `responseToPostId: null`

### Friends
- `Friends.userId` = requester, `Friends.friendId` = target (asymmetric schema)
- `Friends.status` is a `FriendRequestStatus` enum: `PENDING` / `ACCEPTED` / `REJECTED` (replaced old `accepted` boolean)
- Rejected records persist in the DB (not deleted on rejection)
- Always query bidirectionally: `OR [{ userId: A, friendId: B }, { userId: B, friendId: A }]`
- `getFriendStatusBetweenUsers(currentUserId: UserId, authorId: UserId): Promise<FriendStatus | undefined>` — returns the friendship status from the current user's perspective, or `undefined` if no record exists. Defined in `src/_server/friendsService.ts`.

### User Lifecycle
1. `POST /api/users` → status `PENDING_EMAIL_VERIFICATION`
2. `GET /api/auth/verify-email` token consumed → status `ACTIVE`
3. On login: if `User.acceptedToS` null or stale → `requiresTOS: true` in JWT → app redirects to TOS page
4. `User.status = SUSPENDED` → middleware blocks all requests → `/account/suspended`
5. `User.status = DELETED` (soft delete; row remains)

### User Deletion Order
`Passwords` has no FK cascade — delete manually before the User row:
1. Comments → 2. Posts → 3. Friends → 4. Sessions + Accounts → 5. Passwords → 6. User

### Admin Audit Log
All consequential admin actions MUST call `logAdminAction()` in `_server/adminService.ts`. Never skip this. `metadata` is `Json?` — use `Prisma.JsonNull` for null, cast objects to `Prisma.InputJsonValue`.

### Image Storage
- R2 paths: `{userId}/{uuid}.{ext}` (original), `{userId}/thumbnails/{uuid}.jpg` (thumbnail)
- Max 2MB (`IMAGES_MAX_SIZE_IN_BYTES`); thumbnails 120×120 JPEG at 80% quality via Sharp
- Deleting image → `Post.imageId = null` via `onDelete: SetNull`

---

## Unimplemented Stubs

| Feature | Detail |
|---|---|
| Custom feed sources | `FeedSourceSchema` accepts cuid2; `getFeed()` throws on anything other than `public`/`private` |
| Hashtag search | No implementation in routes or services |
