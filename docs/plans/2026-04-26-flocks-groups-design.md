# Flocks (Groups) Feature Design

**Date:** 2026-04-26  
**Branch:** MOC-90-Ability-for-a-user-to-create-and-join-a-group  
**Naming convention:** "Flock" in UI/product; `group`/`Group` in code and database.

---

## Overview

Add group (flock) support to Mockingbird. Users can create named groups called "Flocks", invite others, post content scoped to the group, and manage membership with a four-tier role system. Groups can be public (open join) or private (invite/request only).

---

## Approach

**Option A — Flock as a first-class audience type.**

Extend the existing `Audience` enum with a `GROUP` value. Add a nullable `groupId` field to `Post`. The existing `feedService` stub for custom cuid2 feed sources is implemented for group feeds. Group-level access control is enforced via a new `GroupMember` table — entirely separate from the global RBAC system.

---

## Data Model

### New Tables

#### `Group`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | String (cuid) | No | PK |
| `name` | String | No | Display name; not globally unique |
| `description` | String | Yes | Optional bio/about |
| `avatarUrl` | String | Yes | R2 CDN URL |
| `visibility` | `GroupVisibility` | No | Enum: `PUBLIC`, `PRIVATE` |
| `status` | `GroupStatus` | No | Enum: `ACTIVE`, `DISABLED` |
| `ownerId` | String | No | FK → User.id |
| `createdAt` | DateTime | No | |
| `updatedAt` | DateTime | No | `@updatedAt` |

#### `GroupMember`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | String (cuid) | No | PK |
| `groupId` | String | No | FK → Group.id (cascade delete) |
| `userId` | String | No | FK → User.id (cascade delete) |
| `role` | `GroupRole` | No | Enum: `OWNER`, `ADMIN`, `MEMBER`, `LURKER` |
| `joinedAt` | DateTime | No | |

Unique constraint: `[groupId, userId]`

#### `GroupInvite`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | String (cuid) | No | PK |
| `groupId` | String | No | FK → Group.id (cascade delete) |
| `invitedUserId` | String | No | FK → User.id (cascade delete) |
| `invitedByUserId` | String | No | User who sent the invite |
| `status` | `GroupInviteStatus` | No | Enum: `PENDING`, `ACCEPTED`, `DECLINED` |
| `createdAt` | DateTime | No | |

#### `GroupJoinRequest`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | String (cuid) | No | PK |
| `groupId` | String | No | FK → Group.id (cascade delete) |
| `userId` | String | No | FK → User.id (cascade delete) |
| `status` | `GroupJoinRequestStatus` | No | Enum: `PENDING`, `ACCEPTED`, `DECLINED` |
| `createdAt` | DateTime | No | |

#### `GroupAuditLog`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | String (cuid) | No | PK |
| `groupId` | String | No | FK → Group.id (cascade delete) |
| `actorId` | String | No | User who performed the action |
| `action` | String | No | Namespaced string e.g. `member.joined` |
| `targetId` | String | Yes | ID of entity acted upon |
| `metadata` | Json | Yes | Additional context; use `Prisma.JsonNull` for null |
| `createdAt` | DateTime | No | |

#### `Notification` (generalized from friend-request-specific)

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | String (cuid) | No | PK |
| `userId` | String | No | FK → User.id (cascade delete) — recipient |
| `type` | String | No | Namespaced string e.g. `"group.invite"`, `"friend.request"` |
| `actorId` | String | Yes | User who triggered the notification |
| `entityId` | String | Yes | ID of the relevant entity |
| `metadata` | Json | Yes | Additional context per notification type |
| `read` | Boolean | No | Default `false` |
| `createdAt` | DateTime | No | |
| `updatedAt` | DateTime | No | `@updatedAt` |

### Changes to Existing Tables

**`Post`** — two new nullable fields:
- `groupId` String? — FK → Group.id (`onDelete: SetNull`)
- When `groupId` is set, `audience` is forced to `GROUP`; audience is ignored for access control

**`Audience` enum** — add `GROUP` value

### Notification Type Constants

Defined in `_types/notifications.ts` as a const map (no enum — extensible without migrations):

```ts
export const NotificationType = {
  FRIEND_REQUEST:               'friend.request',
  FRIEND_REQUEST_ACCEPTED:      'friend.request.accepted',
  GROUP_INVITE:                 'group.invite',
  GROUP_INVITE_ACCEPTED:        'group.invite.accepted',
  GROUP_INVITE_DECLINED:        'group.invite.declined',
  GROUP_JOIN_REQUEST:           'group.join_request',
  GROUP_JOIN_REQUEST_ACCEPTED:  'group.join_request.accepted',
  GROUP_JOIN_REQUEST_DECLINED:  'group.join_request.declined',
  GROUP_OWNERSHIP_TRANSFERRED:  'group.ownership.transferred',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];
```

---

## API Routes

### Groups

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/groups` | Any user | Create a group (creator becomes Owner) |
| `GET` | `/api/groups?q=` | Any user | Search groups by name (returns public + private, marked) |
| `GET` | `/api/groups/[groupId]` | Any user | Get group details |
| `PATCH` | `/api/groups/[groupId]` | Admin+ (status field: Owner only) | Edit name, description, avatar, visibility, status |
| `DELETE` | `/api/groups/[groupId]` | Owner | Hard-delete group + all posts + all members |
| `GET` | `/api/groups/[groupId]/export` | Admin+ | Download group posts as JSON archive |

### Membership

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/groups/[groupId]/members` | Member+ | List members |
| `POST` | `/api/groups/[groupId]/members` | Any user (public group) | Join public group (becomes Member) |
| `DELETE` | `/api/groups/[groupId]/members/[userId]` | Self (leave) or Admin+ (remove) | Leave or remove a member |
| `PATCH` | `/api/groups/[groupId]/members/[userId]` | Admin+ | Change a member's role |
| `POST` | `/api/groups/[groupId]/transfer` | Owner | Transfer ownership to another member |

### Invites

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/groups/[groupId]/invites` | Admin+ | Invite a user |
| `PATCH` | `/api/groups/[groupId]/invites/[inviteId]` | Invited user | Accept or decline invite |

### Join Requests

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/groups/[groupId]/requests` | Any user | Request to join a private group |
| `PATCH` | `/api/groups/[groupId]/requests/[requestId]` | Admin+ | Accept or decline join request |

### Feed

Existing `GET /api/users/[userId]/feed?feed=<groupId>` — passing a `groupId` activates the group feed. Implements the existing `feedService` stub for custom cuid2 feed sources. Group feed returns all top-level posts where `groupId` matches, for members only.

### Posts

`POST /api/posts` gains an optional `groupId` field. When present:
- `audience` is forced to `GROUP`
- Access is validated against `GroupMember` (role must be `MEMBER`, `ADMIN`, or `OWNER`)
- Post is visible only to group members

### Audit Log

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/groups/[groupId]/audit` | Admin+ | View group audit log, paginated |

---

## Permissions & Access Control

Group-level access is enforced entirely through `GroupMember.role`. The global `UserPermission`/`UserRole` RBAC system is not involved in group permissions.

### Role Capabilities Matrix

| Action | Lurker | Member | Admin | Owner |
|---|---|---|---|---|
| View group details | ✓ | ✓ | ✓ | ✓ |
| View group feed | ✓ | ✓ | ✓ | ✓ |
| Create post to group | — | ✓ | ✓ | ✓ |
| Comment on group post | — | ✓ | ✓ | ✓ |
| React to group post | — | ✓ | ✓ | ✓ |
| Invite users | — | — | ✓ | ✓ |
| Accept/decline join requests | — | — | ✓ | ✓ |
| Remove members | — | — | ✓ | ✓ |
| Change member roles (up to Admin) | — | — | ✓ | ✓ |
| Edit group details/avatar/visibility | — | — | ✓ | ✓ |
| Moderate (remove) posts | — | — | ✓ | ✓ |
| View audit log | — | — | ✓ | ✓ |
| Export archive | — | — | ✓ | ✓ |
| Disable/enable group | — | — | — | ✓ |
| Transfer ownership | — | — | — | ✓ |
| Hard-delete group | — | — | — | ✓ |
| Promote member to Owner role | — | — | — | ✓ |

### Non-member Access

- **Public groups**: any authenticated user can view group details and search results. Feed and posts require joining.
- **Private groups**: non-members see only name, description, avatar, and visibility status — no feed, no member list.

### Platform Admin Override

Users with the platform-level `posts:delete` permission can moderate group posts regardless of group membership, consistent with existing behavior.

---

## Group Lifecycle

- **Active**: normal operation
- **Disabled**: read-only. No new posts, comments, or reactions. Existing content visible to members. Owner can re-enable.
- **Hard-deleted**: owner triggers DELETE after disabling. All posts, members, invites, requests, audit logs cascade-deleted. A final audit log entry (`group.deleted`) is written before deletion.
- **Archive export**: available at any time to Admin+. Downloads all group posts (including comments and reactions) as a JSON file.

---

## Group Audit Log Events

All actions recorded in `GroupAuditLog` except post creation and commenting.

| Action string | Triggered by | `targetId` |
|---|---|---|
| `member.joined` | User joins or is accepted | `userId` |
| `member.left` | User leaves | `userId` |
| `member.removed` | Admin removes member | `userId` |
| `member.role_changed` | Admin changes role | `userId` |
| `invite.sent` | Admin invites user | `inviteId` |
| `invite.accepted` | User accepts invite | `inviteId` |
| `invite.declined` | User declines invite | `inviteId` |
| `request.sent` | User requests to join | `requestId` |
| `request.accepted` | Admin accepts request | `requestId` |
| `request.declined` | Admin declines request | `requestId` |
| `post.removed` | Admin moderates post | `postId` |
| `group.name_changed` | Admin edits name | — |
| `group.description_changed` | Admin edits description | — |
| `group.avatar_changed` | Admin changes avatar | — |
| `group.visibility_changed` | Admin changes visibility | — |
| `group.status_changed` | Owner disables/enables | — |
| `group.ownership_transferred` | Owner transfers ownership | `userId` (new owner) |
| `group.deleted` | Owner hard-deletes | — |

---

## UI / Pages

### New Pages

- **`/groups`** — Flock discovery: search bar, results with avatar/name/member count/Private badge, "Create a Flock" button
- **`/groups/new`** — Create flock form: name, description, avatar upload, visibility
- **`/groups/[groupId]`** — Flock home: header with avatar/name/description/member count/visibility badge; Join or Request to Join for non-members; tabbed view for members (Feed | Members | Requests | Invites | Audit Log | Settings)
- **`/groups/[groupId]/settings`** — Owner/Admin settings: edit details, disable/enable, transfer ownership, hard-delete, export archive

### Updates to Existing Pages

- **`/feed`** (`FeedSelector` component) — add user's joined flocks alongside Public/Private options
- **Header / Notifications** — generalize notification display to handle all `type` strings
- **Post composer** — add optional group targeting when composing from within a group context; hide `audience` selector when `groupId` is set

---

## Key Implementation Notes

- Posts made to a group remain visible after a member leaves or is removed — they are not deleted.
- A disabled group's posts remain visible to existing members (read-only).
- When joining a public group or being accepted into a private group, the default role is `MEMBER`.
- Lurker role must be explicitly assigned by an Admin or Owner — it is not a default join state.
- The `feedService.getFeed()` stub that throws `Unknown feed source` for non-public/private values is the entry point for group feed implementation.
- `GroupAuditLog` uses string-based action names (same convention as `NotificationType`) — new events added by convention without migrations.
