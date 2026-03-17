# API Contracts Reference

## Auth Model

All API routes use one of two guards from `src/app/api/validateAuthentication.ts`:

```ts
// Requires an active session; throws 401 if not logged in
const session = await validateAuthentication(); // returns ActiveSession

// Requires a specific permission; throws 401 if not logged in, 403 if missing permission
const session = await validatePermission('users:view'); // returns ActiveSession
```

`session.user` is a `SessionUser`:
```ts
{
  id: UserId,
  name: string,
  email: EmailAddress,
  image: string | null,
  permissions: string[],   // computed from role + overrides
  status: UserStatus,
  requiresTOS: boolean,
}
```

### Unauthenticated Endpoints
These endpoints require **no auth**:
- `POST /api/users` (account creation)
- `GET /api/documents/[docType]/latest`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-expired-password`
- `GET /api/auth/verify-email`
- All NextAuth routes at `/api/auth/[...nextauth]`

---

## Error Response Shape

All errors return JSON:
```json
{ "message": "...", "status": 400, "statusText": "Bad Request" }
```

**Known quirk**: Zod validation errors return **500** (not 400):
```json
{ "message": "Invalid data: [field.path: error message, ...]", "status": 500, "statusText": "Internal Server Error" }
```

`posterId` mismatch returns **403** — routes manually assert `posterId === session.user.id`.

---

## Validation Rules

| Field | Rule |
|---|---|
| Password | 8–20 chars (no complexity rules beyond length in current schema) |
| Name | 2–100 chars |
| Email | Must match `/^\S+@\S+\.\S+$/` |
| Any ID (PostId, UserId, etc.) | String, 10–255 chars |
| `audience` | `PUBLIC` or `PRIVATE` |
| `FeedSource` | `'public'`, `'private'`, or any cuid2 string (but only public/private work) |
| `DocumentType` | `TOC` or `PRIVACY` |
| `UserRole` | `USER`, `MODERATOR`, `EDITOR`, `SUPER_ADMIN` |
| Image file | Max 2MB (`IMAGES_MAX_SIZE_IN_BYTES`) |
| Document content | Max 1MB |

---

## Endpoints

### Posts

#### `POST /api/posts` — Create post
- **Auth**: `validateAuthentication()`
- **Request body**:
  ```ts
  {
    posterId: UserId,           // required; must equal session.user.id
    audience: Audience,         // required: "PUBLIC" | "PRIVATE"
    content: string,            // required; min 1 char
    imageId?: ImageId,          // optional
    responseToPostId?: PostId,  // optional; set to make this a comment
  }
  ```
- **Response 201**: `Post` object
- **Errors**: 403 if `posterId !== session.user.id`

#### `GET /api/posts/[postId]` — Get post
- **Auth**: `validateAuthentication()`
- **Response 200**: `Post` object
- **Errors**: 404 if not found

#### `DELETE /api/posts/[postId]` — Delete post
- **Auth**: `validateAuthentication()`
- **Authorization**: Must own post OR have `posts:delete` permission
- **Response 204**: No content
- **Errors**: 403 Forbidden, 404 Not Found

#### `GET /api/posts/[postId]/comments` — List comments
- **Auth**: `validateAuthentication()`
- **Query params**: `limit` (optional, integer 1–100)
- **Response 200**: `Post[]`

#### `POST /api/posts/[postId]/comments` — Add comment
- **Auth**: `validateAuthentication()`
- **Request body**:
  ```ts
  {
    posterId: UserId,    // required; must equal session.user.id
    content: string,     // min 1 char (required if no imageId)
    imageId?: ImageId,   // optional
  }
  ```
  At least `content` or `imageId` must be provided.
- **Response 201**: `Post` object (the new comment)
- **Errors**: 403 if `posterId !== session.user.id`; 400 if parent post not found

---

### Users

#### `GET /api/users?q=<query>` — Search users
- **Auth**: `validateAuthentication()`
- **Query params**: `q` (required, min 1 char)
- **Response 200**: `SimpleUserInfo[]`
  ```ts
  { id: UserId, name: string, image: string | null }[]
  ```

#### `POST /api/users` — Register new user
- **Auth**: None
- **Request body**:
  ```ts
  {
    name: string,            // 2–100 chars
    email: string,           // valid email
    password: string,        // 8–20 chars
    turnstileToken?: string, // CAPTCHA token; required in production, skipped on localhost
  }
  ```
- **Response 201**: `{ userId: UserId }`
- **Errors**: 409 if email already exists; 400 if CAPTCHA fails

#### `GET /api/users/[userId]` — Get user profile
- **Auth**: `validateAuthentication()`
- **Response 200**: `UserInfo`
  ```ts
  {
    id: UserId, name: string, image?: string,
    email: EmailAddress, emailVerified?: Date,
    acceptedToS?: DocumentId,
    role: UserRole, status: UserStatus,
    suspensionReason?: string,
    createdAt: Date, updatedAt: Date,
  }
  ```

#### `PATCH /api/users/[userId]` — Update profile image
- **Auth**: `validateAuthentication()`
- **Authorization**: Self only (`userId === session.user.id`)
- **Request body**: `{ imageUrl: string }` (valid URL)
- **Response 200**: Updated `UserInfo`
- **Errors**: 403 if not self

#### `DELETE /api/users/[userId]` — Delete account
- **Auth**: `validateAuthentication()`
- **Authorization**: Self OR `users:delete` permission
- **Response 200**: Deletion result object
- **Errors**: 403 Forbidden, 404 Not Found

---

### Friends

#### `GET /api/users/[userId]/friends` — List friends
- **Auth**: `validateAuthentication()`
- **Authorization**: Self only
- **Response 200**:
  ```ts
  {
    friends: SimpleUserInfo[],       // accepted friends
    pendingFriends: SimpleUserInfo[], // requests sent by userId (awaiting acceptance)
    friendRequests: SimpleUserInfo[], // requests received by userId (userId is friendId)
  }
  ```

#### `PUT /api/users/[userId]/friends/[friendId]` — Send friend request
- **Auth**: `validateAuthentication()`
- **Authorization**: `userId === session.user.id`
- **Response 201**: `{ statusText: "Requested friendship with <friendId>" }`
- **Response 200**: If a record already exists
- **Errors**: 403 Forbidden

#### `POST /api/users/[userId]/friends/[friendId]` — Accept or reject friend request
- **Auth**: `validateAuthentication()`
- **Authorization**: `userId === session.user.id`
- **Request body**: `{ accepted: boolean }`
- **Response 200**: `{ userId, friendId, accepted }`
- **Errors**: 400 if friendship record not found, 403 Forbidden

#### `DELETE /api/users/[userId]/friends/[friendId]` — Remove friend
- **Auth**: `validateAuthentication()`
- **Authorization**: `userId === session.user.id`
- **Response 200**: `{ statusText: "Removed friendship with <friendId>" }`
- **Errors**: 403 Forbidden

---

### Feed

#### `GET /api/users/[userId]/feed` — Get feed
- **Auth**: `validateAuthentication()`
- **Path params**: `feed` (query param, not path) — `FeedSource`: `'public'` | `'private'` | cuid2
- **Query params**: `feed` (default `'public'`), `cursor` (optional, PostId for pagination)
- **Response 200**: `{ posts: Post[], cursor?: PostId }`
- **Notes**: Only `public` and `private` are implemented; other values throw

---

### Images

#### `POST /api/users/[userId]/images` — Upload image
- **Auth**: `validateAuthentication()`
- **Authorization**: Self only (`userId === session.user.id`)
- **Request**: multipart form data
  ```
  file?: File          // image file (JPEG, PNG, etc.) OR
  imageUrl?: string    // external URL
  description?: string
  albumId?: AlbumId
  ```
  Must provide either `file` or `imageUrl`.
- **Response 201**: `Image` object
  ```ts
  {
    id: ImageId, ownerId: string,
    imageUrl: string, thumbnailUrl: string,
    description: string, albumId?: AlbumId,
    createdAt: Date, updatedAt: Date,
  }
  ```
- **Errors**: 400 if userId mismatch; 409 `"No Image Provided"` if neither file nor URL

#### `GET /api/users/[userId]/images` — List images
- **Auth**: `validateAuthentication()`
- **Response 200**: `Image[]`

#### `DELETE /api/images/[imageId]` — Delete image
- **Auth**: `validateAuthentication()`
- **Authorization**: Owner only
- **Response 204**: No content
- **Errors**: 403, 404

---

### Password & Auth

#### `POST /api/users/[userId]/password` — Change password (logged in)
- **Auth**: `validateAuthentication()`
- **Authorization**: Self only
- **Request body**:
  ```ts
  { currentPassword: string, newPassword: string } // newPassword: 8–20 chars
  ```
- **Response 200**: `{}`
- **Errors**: 403 if not self; 401 if current password wrong; 400 if new === current

#### `POST /api/auth/forgot-password` — Initiate password reset
- **Auth**: None
- **Request body**: `{ email: string }`
- **Response 200**: `{ message: "If that email exists, a reset link was sent." }` — always 200 (email enumeration protection)

#### `POST /api/auth/reset-password` — Complete password reset
- **Auth**: None
- **Request body**: `{ token: string, newPassword: string }`
- **Response 200**: `{ email: string }`
- **Errors**: 400 if token invalid/expired

#### `POST /api/auth/change-expired-password` — Change expired password on login
- **Auth**: None
- **Request body**: `{ email: string, currentPassword: string, newPassword: string }`
- **Response 200**: `{ email: string }`
- **Errors**: 401 if credentials invalid

#### `POST /api/auth/resend-verification` — Resend email verification
- **Auth**: `validateAuthentication()`
- **Validation**: User must have `status === 'PENDING_EMAIL_VERIFICATION'`
- **Response 200**: `{ message: "Verification email sent" }`
- **Errors**: 400 if email verification not required

#### `GET /api/auth/verify-email?token=<token>` — Verify email
- **Auth**: None
- **Response**: 302 redirect to `/` on success; redirect to `/auth/verify-email?error=invalid` on failure

#### `PUT /api/users/[userId]/tos/[tosId]` — Accept Terms of Service
- **Auth**: Not required (open for signup flow)
- **Response 200**: `{ accepted: tosId }`
- **Side effect**: Sets `User.acceptedToS = tosId`; initiates email verification if not yet verified

---

### Documents

#### `GET /api/documents/[docType]/latest` — Get latest document
- **Auth**: None
- **Path params**: `docType`: `TOC` | `PRIVACY`
- **Response 200**: `Document` | 404 if none exist

#### `GET /api/documents/[docType]/[version]` — Get specific version
- **Auth**: `validateAuthentication()`
- **Response 200**: `Document`

#### `POST /api/documents/[docType]` — Create new document version
- **Auth**: `validatePermission('documents:create')`
- **Request**: multipart form data — `{ file?: File, content?: string }` (max 1MB; must provide one)
- **Response 201**: `Document`
  ```ts
  { id: DocumentId, type: DocumentType, creatorId: string, version: number, content: string, createdAt: Date, updatedAt: Date }
  ```

---

### Admin

All admin endpoints require `admin:access` or the specific listed permission (which implies `admin:access`).

#### `GET /api/admin/users` — List users
- **Permission**: `users:view`
- **Query params**: `page` (default 1), `limit` (default 20), `q` (optional search string)
- **Response 200**: `{ users: UserInfo[], total: number, page: number, limit: number }`

#### `GET /api/admin/users/[userId]` — Get user
- **Permission**: `users:view`
- **Response 200**: `UserInfo`

#### `PUT /api/admin/users/[userId]` — Change user role
- **Permission**: `users:edit`
- **Request body**: `{ role: UserRole }`
- **Response 200**: Updated `UserInfo`
- **Side effect**: Logged to `AdminAuditLog`

#### `DELETE /api/admin/users/[userId]` — Delete user (admin)
- **Permission**: `users:delete`
- **Response 204**: No content

#### `POST /api/admin/users/[userId]/suspend` — Suspend user
- **Permission**: `users:suspend`
- **Request body**: `{ reason: string }` (required)
- **Response 200**: Updated `UserInfo` with `status: 'SUSPENDED'`

#### `DELETE /api/admin/users/[userId]/suspend` — Unsuspend user
- **Permission**: `users:suspend`
- **Response 200**: Updated `UserInfo` with `status: 'ACTIVE'`

#### `GET /api/admin/users/[userId]/permissions` — Get permission overrides
- **Permission**: `users:permissions`
- **Response 200**: `{ permission: string, granted: boolean }[]`

#### `PUT /api/admin/users/[userId]/permissions` — Set permission overrides
- **Permission**: `users:permissions`
- **Request body**: `{ overrides: { permission: string, granted: boolean }[] }`
- **Response 204**: No content

#### `GET /api/admin/posts` — List all posts for moderation
- **Permission**: `posts:view_all`
- **Query params**: `page`, `limit`
- **Response 200**: `{ posts: Post[], total: number, page: number, limit: number }`

#### `DELETE /api/admin/posts/[postId]` — Delete post (admin)
- **Permission**: `posts:delete`
- **Response 204**: No content
- **Side effect**: Logged to `AdminAuditLog` with action `DELETE_POST`

#### `GET /api/admin/audit` — Get audit log
- **Permission**: `admin:access`
- **Query params**: `page`, `limit`
- **Response 200**: `{ entries: AdminAuditLog[], total: number, page: number, limit: number }`

#### `GET /api/admin/logs` — Get system logs
- **Permission**: `system:logs`
- **Query params**: `date`, `level`, `page`, `limit`
- **Response 200**: `{ entries: LogEntry[], total: number, page: number, limit: number }`

---

## Permission Reference

```
SUPER_ADMIN: all permissions
MODERATOR:   admin:access, users:view, users:suspend, posts:view_all, posts:delete
EDITOR:      admin:access, documents:create
USER:        (none)
```

All permissions: `admin:access`, `users:view`, `users:edit`, `users:suspend`, `users:delete`, `users:permissions`, `posts:view_all`, `posts:delete`, `system:logs`, `documents:create`

Per-user overrides can grant or revoke individual permissions regardless of role. Computed via `computePermissions(role, overrides)` in `_types/permissions.ts`.
