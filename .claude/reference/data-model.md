# Data Model Reference

Source of truth: `apps/mockingbird/prisma/schema.prisma`

---

## Full Schema Reference

### User

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `name` | String | No | — | Display name |
| `email` | String | Yes | — | Unique; nullable for OAuth users before email confirmed |
| `emailVerified` | DateTime | Yes | — | Set when email verification token is consumed |
| `image` | String | Yes | — | URL to profile picture |
| `acceptedToS` | String | Yes | — | `DocumentId` of the accepted Terms of Service; null = never accepted |
| `role` | UserRole | No | `USER` | Enum: `USER`, `MODERATOR`, `EDITOR`, `SUPER_ADMIN` |
| `status` | UserStatus | No | `ACTIVE` | Enum: `ACTIVE`, `SUSPENDED`, `DELETED`, `PENDING_EMAIL_VERIFICATION` |
| `suspensionReason` | String | Yes | — | Required when status = `SUSPENDED` |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | `@updatedAt` | |

Relations: `accounts Account[]`, `sessions Session[]`, `posts Post[]`, `friends Friends[]`, `permissionOverrides UserPermission[]`, `passwordResetTokens PasswordResetToken[]`, `emailVerificationTokens EmailVerificationToken[]`

---

### Post

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `posterId` | String | No | — | FK → User.id (`onDelete: Cascade`) |
| `responseToPostId` | String | Yes | — | FK → Post.id (`onDelete: Cascade`); **null = top-level post, non-null = comment** |
| `audience` | Audience | No | `PUBLIC` | Enum: `PUBLIC`, `PRIVATE` |
| `content` | String | No | — | Text content; required even on image-only posts |
| `likeCount` | Int | No | `0` | **No increment endpoint exists — stub** |
| `dislikeCount` | Int | No | `0` | **No increment endpoint exists — stub** |
| `imageId` | String | Yes | — | FK → Image.id (`onDelete: SetNull`) |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | `@updatedAt` | |

**Key rule**: Always filter `responseToPostId: null` when querying for feed posts. Comments are fetched via the `responses` relation or by filtering `responseToPostId: <parentId>`.

---

### Friends

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `userId` | String | No | — | FK → User.id (`onDelete: Cascade`); **the requester** |
| `friendId` | String | No | — | The target user (no FK relation defined — raw string) |
| `status` | FriendRequestStatus | No | `PENDING` | Enum: `PENDING`, `ACCEPTED`, `REJECTED` |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | `@updatedAt` | |

**`FriendRequestStatus` enum**: `PENDING` = sent but not yet actioned; `ACCEPTED` = established friendship; `REJECTED` = declined. Rejected records **persist** in the DB (not deleted on rejection).

**Key rule**: The `Friends` table is asymmetric — only the requester's `userId` has a Prisma relation. To find any friendship record between users A and B:
```ts
await prisma.friends.findFirst({
  where: { OR: [{ userId: A, friendId: B }, { userId: B, friendId: A }] }
});
```

---

### Image

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `ownerId` | String | No | — | Raw string (no Prisma FK relation) |
| `imageUrl` | String | No | — | URL to original image (R2 CDN) |
| `thumbnailUrl` | String | No | — | URL to 120×120 JPEG thumbnail (R2 CDN) |
| `description` | String | No | — | Required, but can be empty string |
| `albumId` | String | Yes | — | FK → Album.id (`onDelete: SetNull`) |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | `@updatedAt` | |

Relations: `album Album?`, `posts Post[]` (posts that reference this image)

---

### Album

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `ownerId` | String | No | — | Raw string (no Prisma FK relation) |
| `name` | String | No | — | Album display name |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | `@updatedAt` | |

Relations: `images Image[]`

---

### Document

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `type` | DocumentType | No | — | Enum: **`TOC`** (terms of service), `PRIVACY` (privacy policy) |
| `creatorId` | String | No | — | Raw string (user ID of creator) |
| `version` | Int | No | — | Incremented on each new document of same type |
| `content` | String | No | — | Full text content of the document |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | `@updatedAt` | |

**Note**: Terms of Service type is `TOC`, not `TOS`.

---

### Passwords

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `userId` | String | No | — | Unique; raw string — **no Prisma FK relation, no cascade delete** |
| `password` | String | No | — | bcryptjs hash |
| `expiresAt` | DateTime | No | — | When the password expires; checked on login |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | `@updatedAt` | |

**Critical**: No cascade delete. When deleting a user, delete `Passwords` row manually before the User row.

---

### UserPermission

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `userId` | String | No | — | FK → User.id (`onDelete: Cascade`) |
| `permission` | String | No | — | Permission name string |
| `granted` | Boolean | No | — | `true` = grant; `false` = revoke (overrides role default) |

Unique constraint: `[userId, permission]`

---

### PasswordResetToken / EmailVerificationToken

Same shape for both:

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `userId` | String | No | — | FK → User.id (`onDelete: Cascade`) |
| `token` | String | No | — | Unique random token |
| `expiresAt` | DateTime | No | — | Token expiry |
| `usedAt` | DateTime | Yes | — | Set when token is consumed; used tokens are invalid |
| `createdAt` | DateTime | No | `now()` | |

---

### AdminAuditLog

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | String | No | `cuid()` | Primary key |
| `actorId` | String | No | — | ID of the admin who performed the action |
| `action` | String | No | — | Action name (e.g., `DELETE_POST`) |
| `targetId` | String | Yes | — | ID of the entity acted upon |
| `metadata` | Json | Yes | — | Additional context; use `Prisma.JsonNull` for null |
| `createdAt` | DateTime | No | `now()` | |

---

### NextAuth Tables (Account, Session, VerificationToken)

Standard NextAuth/Prisma adapter tables. `Account` and `Session` both cascade-delete when the parent `User` is deleted.

---

## Cascade / Delete Behavior

| Action | What gets deleted automatically |
|---|---|
| Delete User | Account, Session, Post (→ their comments), Friends (where userId=user), UserPermission, PasswordResetToken, EmailVerificationToken |
| Delete Post | All `responses` (comments) on that post |
| Delete Image | Sets `Post.imageId = null` on all posts referencing it; sets `Image.albumId = null` when album deleted |
| Delete Album | Sets `Image.albumId = null` |
| **Delete User** | **Does NOT delete Passwords row** — must be deleted manually first |

---

## Prisma 7 Gotchas

### No `url` in datasource block
```prisma
// CORRECT in schema.prisma:
datasource db {
  provider = "cockroachdb"
}
// DB connection config lives in apps/mockingbird/prisma.config.ts
```

### Generated client location
The client is generated to `apps/mockingbird/prisma/generated/`, NOT `@prisma/client`. Import as:
```ts
import { PrismaClient } from '../../../prisma/generated/client.js';
// or via the db singleton:
import { prisma } from '@/_server/db';
```

Enums are imported from the generated path:
```ts
import { Audience, UserRole } from '../../prisma/generated/enums.js';
```

Always use the `prisma` singleton from `@/_server/db` — never instantiate `PrismaClient` directly.

### Json fields
For `AdminAuditLog.metadata` (and any future `Json?` fields):
```ts
// Null value:
await prisma.adminAuditLog.create({ data: { ..., metadata: Prisma.JsonNull } });

// Object value:
await prisma.adminAuditLog.create({
  data: { ..., metadata: { key: 'value' } as Prisma.InputJsonValue }
});
```

### CockroachDB string filter
Case-insensitive search works:
```ts
where: { name: { contains: query, mode: 'insensitive' } }
```

### Migrations
Run migrations from `apps/mockingbird/` directory:
```bash
DATABASE_URL=<url> npx prisma migrate dev --name <migration-name>
```
Or via Nx: `nx run mockingbird:prisma-migrate` (requires `name` option set in `project.json`).

---

## Common Query Patterns

### Friends lookup (always bidirectional)
```ts
const friendship = await prisma.friends.findFirst({
  where: {
    OR: [
      { userId: userA, friendId: userB },
      { userId: userB, friendId: userA },
    ],
  },
});
```

### Feed posts (exclude comments)
```ts
const posts = await prisma.post.findMany({
  where: { responseToPostId: null, audience: 'PUBLIC' },
  orderBy: { createdAt: 'desc' },
  take: 50,
});
```

### Cursor-based pagination
```ts
const posts = await prisma.post.findMany({
  where: { ... },
  orderBy: { createdAt: 'desc' },
  take: 50,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
});
```

### Comments on a post
```ts
const comments = await prisma.post.findMany({
  where: { responseToPostId: postId },
  orderBy: { createdAt: 'asc' },
  take: limit,
});
```

---

## Branded ID Types

All IDs use branded string types for compile-time safety. Never pass a raw `string` where a branded ID is expected.

```ts
import { PostId, PostIdSchema, UserId, UserIdSchema, ImageId, ImageIdSchema, AlbumId, AlbumIdSchema, DocumentId, DocumentIdSchema } from '@/_types';

// Validate/cast from unknown input:
const postId = PostIdSchema.parse(rawString); // throws if invalid
```

ID validation rules (`createDatabaseIdSchema`): string, length 10–255 characters.

Import all types from `@/_types` (re-exported from `apps/mockingbird/src/_types/index.ts`).
