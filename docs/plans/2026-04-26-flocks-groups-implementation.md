# Flocks (Groups) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add group ("Flock") support to Mockingbird — users can create groups, invite members, post scoped content, and manage membership with a four-tier role system.

**Architecture:** Extend the existing `Audience` enum with `GROUP`; add a nullable `groupId` to `Post`; enforce group access through a new `GroupMember` table (separate from the global RBAC). The existing `feedService` cuid2 stub is implemented for group feeds. All notification types are unified into a single `Notification` table with string-based type constants.

**Tech Stack:** Next.js 15 App Router, Prisma 7 / CockroachDB, Zod, Jest, Tailwind + DaisyUI, NextAuth v5. Run all tests with `nx run mockingbird:test`. Package manager: npm.

**Naming:** "Flock" in UI/product copy; `group`/`Group` in all code, DB, and API names.

**Deployability rule:** Each phase is independently deployable — the app remains fully functional after merging any single phase. Never ship a half-wired feature; every phase either adds behind-the-scenes infrastructure or adds a complete, working user-facing capability.

---

## Phase 1 — Generalize the Notification System

**Why first:** The notification system is self-contained infrastructure with no dependency on group code. Completing it unblocks all group notification work in later phases and ships value independently (friend request notifications move to the new table).

**Deployable result:** Notification badge count still works; friend request notifications now live in the `Notification` table. No visible user change.

---

### Task 1: Add `Notification` model to Prisma schema

**Files:**
- Modify: `apps/mockingbird/prisma/schema.prisma`

**Step 1: Add model to schema**

Open `apps/mockingbird/prisma/schema.prisma`. After the `AdminAuditLog` model (around line 146), add:

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  actorId   String?
  entityId  String?
  metadata  Json?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Also add the relation to the `User` model — inside the `User` model body, after `reactions PostReaction[]`, add:

```prisma
  notifications Notification[]
```

**Step 2: Run migration**

```bash
nx run mockingbird:prisma-generate
```

Then from `apps/mockingbird/`:
```bash
DATABASE_URL=<your-dev-url> npx prisma migrate dev --name add-notification-model
```

**Step 3: Verify**

```bash
nx run mockingbird:build
```

Expected: Build succeeds; no type errors about missing Notification.

**Step 4: Commit**

```bash
git add apps/mockingbird/prisma/schema.prisma apps/mockingbird/prisma/migrations/
git commit -m "feat: add Notification model to Prisma schema"
```

---

### Task 2: Add `NotificationType` constants to `_types`

**Files:**
- Create: `apps/mockingbird/src/_types/notifications.ts`
- Modify: `apps/mockingbird/src/_types/index.ts`

**Step 1: Write the failing test**

Create `apps/mockingbird/src/_types/__tests__/notifications.spec.ts`:

```ts
import { NotificationType, isNotificationType } from '../notifications';

describe('NotificationType', () => {
  it('exports all expected type strings', () => {
    expect(NotificationType.FRIEND_REQUEST).toBe('friend.request');
    expect(NotificationType.FRIEND_REQUEST_ACCEPTED).toBe('friend.request.accepted');
    expect(NotificationType.GROUP_INVITE).toBe('group.invite');
    expect(NotificationType.GROUP_INVITE_ACCEPTED).toBe('group.invite.accepted');
    expect(NotificationType.GROUP_INVITE_DECLINED).toBe('group.invite.declined');
    expect(NotificationType.GROUP_JOIN_REQUEST).toBe('group.join_request');
    expect(NotificationType.GROUP_JOIN_REQUEST_ACCEPTED).toBe('group.join_request.accepted');
    expect(NotificationType.GROUP_JOIN_REQUEST_DECLINED).toBe('group.join_request.declined');
    expect(NotificationType.GROUP_OWNERSHIP_TRANSFERRED).toBe('group.ownership.transferred');
  });

  it('isNotificationType returns true for valid types', () => {
    expect(isNotificationType('friend.request')).toBe(true);
    expect(isNotificationType('group.invite')).toBe(true);
  });

  it('isNotificationType returns false for unknown strings', () => {
    expect(isNotificationType('unknown.type')).toBe(false);
    expect(isNotificationType('')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
nx run mockingbird:test --testFile=src/_types/__tests__/notifications.spec.ts
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `apps/mockingbird/src/_types/notifications.ts`:

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

const ALL_TYPES = new Set<string>(Object.values(NotificationType));

export function isNotificationType(value: string): value is NotificationType {
  return ALL_TYPES.has(value);
}
```

Add to `apps/mockingbird/src/_types/index.ts`:

```ts
export * from './notifications';
```

**Step 4: Run test to verify it passes**

```bash
nx run mockingbird:test --testFile=src/_types/__tests__/notifications.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_types/notifications.ts apps/mockingbird/src/_types/__tests__/notifications.spec.ts apps/mockingbird/src/_types/index.ts
git commit -m "feat: add NotificationType constants to _types"
```

---

### Task 3: Create `notificationService.ts`

**Files:**
- Create: `apps/mockingbird/src/_server/notificationService.ts`
- Create: `apps/mockingbird/src/_server/__tests__/notificationService.spec.ts`

**Step 1: Write failing tests**

Create `apps/mockingbird/src/_server/__tests__/notificationService.spec.ts`:

```ts
jest.mock('@/_server/db', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/_server/logger', () => ({
  default: { child: jest.fn().mockReturnValue({ info: jest.fn(), error: jest.fn() }) },
}));

// @ts-expect-error
import { prisma } from '@/_server/db';
import {
  createNotification,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationRead,
} from '../notificationService';
import { NotificationType } from '@/_types';

const notificationCreateMock = jest.mocked(prisma.notification.create);
const notificationFindManyMock = jest.mocked(prisma.notification.findMany);
const notificationCountMock = jest.mocked(prisma.notification.count);
const notificationUpdateMock = jest.mocked(prisma.notification.update);

const USER_ID = 'cm1750szo00001ocb5aog8ley' as any;
const ACTOR_ID = 'cm1srlg8f000014ng4h8nudwi' as any;

describe('createNotification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a notification with required fields', async () => {
    notificationCreateMock.mockResolvedValue({ id: 'notif1' } as any);
    await createNotification({
      userId: USER_ID,
      type: NotificationType.FRIEND_REQUEST,
      actorId: ACTOR_ID,
      entityId: 'entity1',
    });
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_ID,
        type: NotificationType.FRIEND_REQUEST,
        actorId: ACTOR_ID,
        entityId: 'entity1',
        read: false,
      }),
    });
  });
});

describe('getUnreadNotificationCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns count of unread notifications', async () => {
    notificationCountMock.mockResolvedValue(3);
    const count = await getUnreadNotificationCount(USER_ID);
    expect(count).toBe(3);
    expect(notificationCountMock).toHaveBeenCalledWith({
      where: { userId: USER_ID, read: false },
    });
  });
});

describe('markNotificationRead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks a notification as read', async () => {
    notificationUpdateMock.mockResolvedValue({} as any);
    await markNotificationRead('notif1');
    expect(notificationUpdateMock).toHaveBeenCalledWith({
      where: { id: 'notif1' },
      data: { read: true },
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/notificationService.spec.ts
```

Expected: FAIL — module not found.

**Step 3: Implement**

Create `apps/mockingbird/src/_server/notificationService.ts`:

```ts
import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { NotificationType, UserId } from '@/_types';

const logger = baseLogger.child({ service: 'notification:service' });

type CreateNotificationParams = {
  userId: UserId;
  type: NotificationType;
  actorId?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      actorId: params.actorId,
      entityId: params.entityId,
      metadata: params.metadata ? (params.metadata as object) : undefined,
      read: false,
    },
  });
  logger.info(`Created notification type=${params.type} for userId=${params.userId}`);
}

export async function getNotificationsForUser(userId: UserId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadNotificationCount(userId: UserId): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: UserId): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
```

**Step 4: Run test to verify it passes**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/notificationService.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/notificationService.ts apps/mockingbird/src/_server/__tests__/notificationService.spec.ts
git commit -m "feat: add notificationService with create, read, count, mark-read"
```

---

### Task 4: Add Notification API routes

**Files:**
- Create: `apps/mockingbird/src/app/api/notifications/route.ts`
- Create: `apps/mockingbird/src/app/api/notifications/[notificationId]/route.ts`

**Step 1: Implement `GET /api/notifications`**

Create `apps/mockingbird/src/app/api/notifications/route.ts`:

```ts
import { getNotificationsForUser } from '@/_server/notificationService';
import { UserIdSchema } from '@/_types';
import { NextResponse } from 'next/server';
import { respondWithError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

export async function GET() {
  try {
    const session = await validateAuthentication();
    const userId = UserIdSchema.parse(session.user?.id);
    const notifications = await getNotificationsForUser(userId);
    return NextResponse.json(notifications);
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 2: Implement `PATCH /api/notifications/[notificationId]`**

Create `apps/mockingbird/src/app/api/notifications/[notificationId]/route.ts`:

```ts
import { markNotificationRead, markAllNotificationsRead } from '@/_server/notificationService';
import { UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

const PatchSchema = z.object({ read: z.literal(true) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await validateAuthentication();
    const { notificationId } = await params;
    PatchSchema.parse(await req.json());

    if (notificationId === 'all') {
      const userId = UserIdSchema.parse(session.user?.id);
      await markAllNotificationsRead(userId);
    } else {
      await markNotificationRead(notificationId);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 3: Verify build**

```bash
nx run mockingbird:build
```

Expected: No type errors.

**Step 4: Commit**

```bash
git add apps/mockingbird/src/app/api/notifications/
git commit -m "feat: add GET /api/notifications and PATCH /api/notifications/[id] routes"
```

---

### Task 5: Update `notificationCount` to use `Notification` table

**Files:**
- Modify: `apps/mockingbird/src/_server/notificationCount.ts`

**Step 1: Update to query Notification table**

Replace the content of `apps/mockingbird/src/_server/notificationCount.ts`:

```ts
import { getUnreadNotificationCount } from '@/_server/notificationService';
import { UserId } from '@/_types';

export async function getNotificationCount(userId: UserId): Promise<number> {
  return getUnreadNotificationCount(userId);
}
```

> Note: Friend request notifications are not yet migrated to the `Notification` table — the count will temporarily be 0 until Phase 1 Task 6 seeds friend requests into the new table. This is acceptable since the badge is cosmetic.

**Step 2: Verify build**

```bash
nx run mockingbird:build
```

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_server/notificationCount.ts
git commit -m "feat: wire notification count to Notification table"
```

---

### Task 6: Emit friend request notifications via `notificationService`

**Files:**
- Modify: `apps/mockingbird/src/_server/friendsService.ts`

**Step 1: Find where friend requests are created**

In `apps/mockingbird/src/_server/friendsService.ts`, find the `requestFriendshipBetweenUsers` function and any accept/reject functions.

**Step 2: Add notification creation calls**

After a successful friend request creation, emit a `FRIEND_REQUEST` notification to the target user. After acceptance, emit `FRIEND_REQUEST_ACCEPTED` to the requester.

In `requestFriendshipBetweenUsers`, after `prisma.friends.create(...)`:
```ts
await createNotification({
  userId: friendId as UserId,
  type: NotificationType.FRIEND_REQUEST,
  actorId: userId,
  entityId: result.id,
});
```

In the accept handler (wherever `status: 'ACCEPTED'` is set), after the DB update:
```ts
await createNotification({
  userId: request.userId as UserId,  // the original requester
  type: NotificationType.FRIEND_REQUEST_ACCEPTED,
  actorId: friendId,
  entityId: request.id,
});
```

Add imports at top of `friendsService.ts`:
```ts
import { createNotification } from '@/_server/notificationService';
import { NotificationType } from '@/_types';
```

**Step 3: Run existing tests**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/friendsService.spec.ts
```

Expected: All existing tests still pass (mocks isolate the notification call).

**Step 4: Build**

```bash
nx run mockingbird:build
```

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/friendsService.ts
git commit -m "feat: emit friend request notifications via notificationService"
```

**Deploy Phase 1.** The notification infrastructure is in place and tested. Friend request notifications now flow through the unified system.

---

## Phase 2 — Group Schema & Types

**Why next:** All subsequent phases depend on the DB schema and Zod types existing. This phase is pure infrastructure — no UI, no feature visible to users.

**Deployable result:** New DB tables exist; existing features unaffected.

---

### Task 7: Add Group models to Prisma schema

**Files:**
- Modify: `apps/mockingbird/prisma/schema.prisma`

**Step 1: Add enums**

After the `FriendRequestStatus` enum, add:

```prisma
enum GroupVisibility {
  PUBLIC
  PRIVATE
}

enum GroupStatus {
  ACTIVE
  DISABLED
}

enum GroupRole {
  OWNER
  ADMIN
  MEMBER
  LURKER
}

enum GroupInviteStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum GroupJoinRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
}
```

**Step 2: Add `GROUP` to `Audience` enum**

```prisma
enum Audience {
  PUBLIC
  PRIVATE
  GROUP
}
```

**Step 3: Add `groupId` to `Post` model**

Inside the `Post` model, add:
```prisma
  groupId  String?
  group    Group?  @relation(fields: [groupId], references: [id], onDelete: SetNull)
```

**Step 4: Add Group models**

After the `Album` model, add:

```prisma
model Group {
  id          String          @id @default(cuid())
  name        String
  description String?
  avatarUrl   String?
  visibility  GroupVisibility @default(PUBLIC)
  status      GroupStatus     @default(ACTIVE)
  ownerId     String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members      GroupMember[]
  invites      GroupInvite[]
  joinRequests GroupJoinRequest[]
  auditLog     GroupAuditLog[]
  posts        Post[]
}

model GroupMember {
  id      String    @id @default(cuid())
  groupId String
  userId  String
  role    GroupRole @default(MEMBER)

  joinedAt DateTime @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model GroupInvite {
  id              String            @id @default(cuid())
  groupId         String
  invitedUserId   String
  invitedByUserId String
  status          GroupInviteStatus @default(PENDING)

  createdAt DateTime @default(now())

  group       Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  invitedUser User  @relation("InvitedUser", fields: [invitedUserId], references: [id], onDelete: Cascade)
}

model GroupJoinRequest {
  id      String                 @id @default(cuid())
  groupId String
  userId  String
  status  GroupJoinRequestStatus @default(PENDING)

  createdAt DateTime @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model GroupAuditLog {
  id       String  @id @default(cuid())
  groupId  String
  actorId  String
  action   String
  targetId String?
  metadata Json?

  createdAt DateTime @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
}
```

Also add relations to `User` model:
```prisma
  groupMemberships  GroupMember[]
  groupJoinRequests GroupJoinRequest[]
  groupInvites      GroupInvite[]      @relation("InvitedUser")
```

**Step 5: Run migration**

```bash
nx run mockingbird:prisma-generate
```

From `apps/mockingbird/`:
```bash
DATABASE_URL=<your-dev-url> npx prisma migrate dev --name add-group-models
```

**Step 6: Verify build**

```bash
nx run mockingbird:build
```

**Step 7: Commit**

```bash
git add apps/mockingbird/prisma/schema.prisma apps/mockingbird/prisma/migrations/
git commit -m "feat: add Group, GroupMember, GroupInvite, GroupJoinRequest, GroupAuditLog models to schema"
```

---

### Task 8: Add Group Zod types and branded IDs

**Files:**
- Modify: `apps/mockingbird/src/_types/ids.ts`
- Create: `apps/mockingbird/src/_types/groups.ts`
- Modify: `apps/mockingbird/src/_types/audience.ts`
- Modify: `apps/mockingbird/src/_types/index.ts`

**Step 1: Write failing tests**

Create `apps/mockingbird/src/_types/__tests__/groups.spec.ts`:

```ts
import {
  GroupIdSchema,
  GroupSchema,
  CreateGroupSchema,
  GroupVisibilitySchema,
  GroupStatusSchema,
  GroupRoleSchema,
} from '../groups';

describe('GroupIdSchema', () => {
  it('accepts valid cuid', () => {
    expect(() => GroupIdSchema.parse('cm1750szo00001ocb5aog8ley')).not.toThrow();
  });
  it('rejects empty string', () => {
    expect(() => GroupIdSchema.parse('')).toThrow();
  });
});

describe('CreateGroupSchema', () => {
  it('accepts valid create payload', () => {
    expect(() =>
      CreateGroupSchema.parse({
        name: 'Test Flock',
        visibility: 'PUBLIC',
      })
    ).not.toThrow();
  });

  it('rejects missing name', () => {
    expect(() =>
      CreateGroupSchema.parse({ visibility: 'PUBLIC' })
    ).toThrow();
  });
});

describe('GroupVisibilitySchema', () => {
  it('accepts PUBLIC and PRIVATE', () => {
    expect(GroupVisibilitySchema.parse('PUBLIC')).toBe('PUBLIC');
    expect(GroupVisibilitySchema.parse('PRIVATE')).toBe('PRIVATE');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
nx run mockingbird:test --testFile=src/_types/__tests__/groups.spec.ts
```

Expected: FAIL — module not found.

**Step 3: Add `GroupId` to ids.ts**

In `apps/mockingbird/src/_types/ids.ts`, add alongside existing branded IDs:

```ts
export const GroupIdSchema = createDatabaseIdSchema('GroupId');
export type GroupId = z.infer<typeof GroupIdSchema>;
```

**Step 4: Update audience.ts to include GROUP**

In `apps/mockingbird/src/_types/audience.ts`, update the enum:

```ts
export const AudienceSchema = z.enum(['PUBLIC', 'PRIVATE', 'GROUP']);
export type Audience = z.infer<typeof AudienceSchema>;
```

**Step 5: Create `groups.ts`**

Create `apps/mockingbird/src/_types/groups.ts`:

```ts
import { z } from 'zod';
import { GroupIdSchema } from './ids';
import { UserIdSchema } from './ids';

export { GroupIdSchema };

export const GroupVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);
export type GroupVisibility = z.infer<typeof GroupVisibilitySchema>;

export const GroupStatusSchema = z.enum(['ACTIVE', 'DISABLED']);
export type GroupStatus = z.infer<typeof GroupStatusSchema>;

export const GroupRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'LURKER']);
export type GroupRole = z.infer<typeof GroupRoleSchema>;

export const GroupInviteStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED']);
export type GroupInviteStatus = z.infer<typeof GroupInviteStatusSchema>;

export const GroupJoinRequestStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED']);
export type GroupJoinRequestStatus = z.infer<typeof GroupJoinRequestStatusSchema>;

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: GroupVisibilitySchema,
});
export type CreateGroup = z.infer<typeof CreateGroupSchema>;

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  visibility: GroupVisibilitySchema.optional(),
  status: GroupStatusSchema.optional(),
});
export type UpdateGroup = z.infer<typeof UpdateGroupSchema>;

export const GroupSchema = z.object({
  id: GroupIdSchema,
  name: z.string(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  visibility: GroupVisibilitySchema,
  status: GroupStatusSchema,
  ownerId: UserIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Group = z.infer<typeof GroupSchema>;

export const GroupMemberSchema = z.object({
  id: z.string(),
  groupId: GroupIdSchema,
  userId: UserIdSchema,
  role: GroupRoleSchema,
  joinedAt: z.coerce.date(),
});
export type GroupMember = z.infer<typeof GroupMemberSchema>;

export const GroupAuditLogActionSchema = z.enum([
  'member.joined',
  'member.left',
  'member.removed',
  'member.role_changed',
  'invite.sent',
  'invite.accepted',
  'invite.declined',
  'request.sent',
  'request.accepted',
  'request.declined',
  'post.removed',
  'group.name_changed',
  'group.description_changed',
  'group.avatar_changed',
  'group.visibility_changed',
  'group.status_changed',
  'group.ownership_transferred',
  'group.deleted',
]);
export type GroupAuditLogAction = z.infer<typeof GroupAuditLogActionSchema>;
```

**Step 6: Export from index.ts**

Add to `apps/mockingbird/src/_types/index.ts`:

```ts
export * from './groups';
```

**Step 7: Run tests**

```bash
nx run mockingbird:test --testFile=src/_types/__tests__/groups.spec.ts
```

Expected: PASS.

**Step 8: Build**

```bash
nx run mockingbird:build
```

Expected: No type errors. The `Audience` type now includes `GROUP` — any code that does exhaustive switch on `Audience` may need a `GROUP` case added. Fix any TypeScript errors that surface.

**Step 9: Commit**

```bash
git add apps/mockingbird/src/_types/groups.ts apps/mockingbird/src/_types/__tests__/groups.spec.ts apps/mockingbird/src/_types/ids.ts apps/mockingbird/src/_types/audience.ts apps/mockingbird/src/_types/index.ts
git commit -m "feat: add Group Zod types, GroupId branded type, GROUP audience value"
```

**Deploy Phase 2.** Schema and types exist. No visible change to users.

---

## Phase 3 — Core Group API (CRUD + Search + Export)

**Deployable result:** Groups can be created, searched, viewed, edited, and deleted via API. No UI yet — this can be verified with cURL or Postman.

---

### Task 9: Create `groupService.ts` — core CRUD

**Files:**
- Create: `apps/mockingbird/src/_server/groupService.ts`
- Create: `apps/mockingbird/src/_server/__tests__/groupService.spec.ts`

**Step 1: Write failing tests**

Create `apps/mockingbird/src/_server/__tests__/groupService.spec.ts`:

```ts
jest.mock('@/_server/db', () => ({
  prisma: {
    group: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    groupAuditLog: {
      create: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(jest.requireMock('@/_server/db').prisma)),
  },
}));

jest.mock('@/_server/logger', () => ({
  default: { child: jest.fn().mockReturnValue({ info: jest.fn(), error: jest.fn() }) },
}));

// @ts-expect-error
import { prisma } from '@/_server/db';
import { createGroup, getGroupById, searchGroups } from '../groupService';

const groupCreateMock = jest.mocked(prisma.group.create);
const groupMemberCreateMock = jest.mocked(prisma.groupMember.create);
const groupFindUniqueMock = jest.mocked(prisma.group.findUnique);
const groupFindManyMock = jest.mocked(prisma.group.findMany);

const OWNER_ID = 'cm1750szo00001ocb5aog8ley' as any;

describe('createGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates group and adds owner as OWNER member', async () => {
    const mockGroup = {
      id: 'cm1srlg8f000014ng4h8nudwi',
      name: 'Test Flock',
      description: null,
      avatarUrl: null,
      visibility: 'PUBLIC',
      status: 'ACTIVE',
      ownerId: OWNER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    groupCreateMock.mockResolvedValue(mockGroup as any);
    groupMemberCreateMock.mockResolvedValue({} as any);

    const result = await createGroup(OWNER_ID, { name: 'Test Flock', visibility: 'PUBLIC' });

    expect(groupCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Test Flock', ownerId: OWNER_ID }),
    });
    expect(groupMemberCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ groupId: mockGroup.id, userId: OWNER_ID, role: 'OWNER' }),
    });
    expect(result.name).toBe('Test Flock');
  });
});

describe('searchGroups', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns matching groups', async () => {
    groupFindManyMock.mockResolvedValue([]);
    const result = await searchGroups('birds');
    expect(groupFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: 'birds' }),
        }),
      })
    );
    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/groupService.spec.ts
```

Expected: FAIL — module not found.

**Step 3: Implement `groupService.ts`**

Create `apps/mockingbird/src/_server/groupService.ts`:

```ts
import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import {
  CreateGroup,
  GroupId,
  GroupSchema,
  GroupAuditLogAction,
  UpdateGroup,
  UserId,
} from '@/_types';

const logger = baseLogger.child({ service: 'group:service' });

export async function createGroup(ownerId: UserId, data: CreateGroup) {
  const group = await prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      visibility: data.visibility,
      ownerId,
    },
  });

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: ownerId, role: 'OWNER' },
  });

  logger.info(`Created group id=${group.id} owner=${ownerId}`);
  return GroupSchema.parse(group);
}

export async function getGroupById(groupId: GroupId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return null;
  return GroupSchema.parse(group);
}

export async function searchGroups(query: string) {
  const groups = await prisma.group.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    take: 50,
    orderBy: { name: 'asc' },
  });
  return groups.map((g) => GroupSchema.parse(g));
}

export async function updateGroup(groupId: GroupId, data: UpdateGroup) {
  const group = await prisma.group.update({
    where: { id: groupId },
    data,
  });
  return GroupSchema.parse(group);
}

export async function deleteGroup(groupId: GroupId) {
  await prisma.group.delete({ where: { id: groupId } });
}

export async function getGroupMemberRole(groupId: GroupId, userId: UserId) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return member?.role ?? null;
}

export async function appendGroupAuditLog(
  groupId: GroupId,
  actorId: UserId,
  action: GroupAuditLogAction,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.groupAuditLog.create({
    data: {
      groupId,
      actorId,
      action,
      targetId,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}

export async function exportGroupPosts(groupId: GroupId) {
  return prisma.post.findMany({
    where: { groupId, responseToPostId: null },
    orderBy: { createdAt: 'asc' },
    include: {
      poster: { select: { id: true, name: true } },
      responses: {
        orderBy: { createdAt: 'asc' },
        include: { poster: { select: { id: true, name: true } } },
      },
      reactions: true,
    },
  });
}
```

**Step 4: Run tests**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/groupService.spec.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/groupService.ts apps/mockingbird/src/_server/__tests__/groupService.spec.ts
git commit -m "feat: add groupService with CRUD, search, audit log, export"
```

---

### Task 10: Add Group API routes

**Files:**
- Create: `apps/mockingbird/src/app/api/groups/route.ts`
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/route.ts`
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/export/route.ts`

**Step 1: Implement `POST /api/groups` and `GET /api/groups`**

Create `apps/mockingbird/src/app/api/groups/route.ts`:

```ts
import { createGroup, searchGroups } from '@/_server/groupService';
import { CreateGroupSchema, GroupRoleSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

export async function GET(req: NextRequest) {
  try {
    await validateAuthentication();
    const q = req.nextUrl.searchParams.get('q') ?? '';
    const groups = await searchGroups(q);
    return NextResponse.json(groups);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await validateAuthentication();
    const ownerId = UserIdSchema.parse(session.user?.id);
    const body = CreateGroupSchema.parse(await req.json());
    const group = await createGroup(ownerId, body);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 2: Implement `GET/PATCH/DELETE /api/groups/[groupId]`**

Create `apps/mockingbird/src/app/api/groups/[groupId]/route.ts`:

```ts
import {
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupMemberRole,
  appendGroupAuditLog,
} from '@/_server/groupService';
import { GroupIdSchema, UpdateGroupSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await validateAuthentication();
    const { groupId } = await params;
    const group = await getGroupById(GroupIdSchema.parse(groupId));
    if (!group) throw new ResponseError(404, 'Group not found');
    return NextResponse.json(group);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const body = UpdateGroupSchema.parse(await req.json());

    // status change restricted to Owner
    if (body.status !== undefined && role !== 'OWNER') {
      throw new ResponseError(403, 'Only the owner can change group status');
    }

    const updated = await updateGroup(gid, body);

    // Audit log
    if (body.name && body.name !== group.name)
      await appendGroupAuditLog(gid, userId, 'group.name_changed');
    if (body.description !== undefined && body.description !== group.description)
      await appendGroupAuditLog(gid, userId, 'group.description_changed');
    if (body.avatarUrl !== undefined && body.avatarUrl !== group.avatarUrl)
      await appendGroupAuditLog(gid, userId, 'group.avatar_changed');
    if (body.visibility && body.visibility !== group.visibility)
      await appendGroupAuditLog(gid, userId, 'group.visibility_changed');
    if (body.status && body.status !== group.status)
      await appendGroupAuditLog(gid, userId, 'group.status_changed');

    return NextResponse.json(updated);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'OWNER') throw new ResponseError(403, 'Only the owner can delete a group');

    await appendGroupAuditLog(gid, userId, 'group.deleted');
    await deleteGroup(gid);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 3: Implement `GET /api/groups/[groupId]/export`**

Create `apps/mockingbird/src/app/api/groups/[groupId]/export/route.ts`:

```ts
import { getGroupById, getGroupMemberRole, exportGroupPosts } from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const posts = await exportGroupPosts(gid);
    const archive = { group, exportedAt: new Date().toISOString(), posts };

    return new NextResponse(JSON.stringify(archive, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="flock-${gid}-export.json"`,
      },
    });
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 4: Verify build**

```bash
nx run mockingbird:build
```

**Step 5: Commit**

```bash
git add apps/mockingbird/src/app/api/groups/
git commit -m "feat: add group CRUD API routes (create, search, get, edit, delete, export)"
```

**Deploy Phase 3.**

---

## Phase 4 — Membership API

**Deployable result:** Users can join public groups, leave, be removed, have roles changed, and ownership transferred.

---

### Task 11: Add membership service functions

**Files:**
- Modify: `apps/mockingbird/src/_server/groupService.ts`

**Step 1: Add membership functions**

Append to `apps/mockingbird/src/_server/groupService.ts`:

```ts
import { GroupRole, GroupMemberSchema } from '@/_types';

export async function getGroupMembers(groupId: GroupId) {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  return members;
}

export async function addGroupMember(groupId: GroupId, userId: UserId, role: GroupRole = 'MEMBER') {
  const member = await prisma.groupMember.create({
    data: { groupId, userId, role },
  });
  return GroupMemberSchema.parse(member);
}

export async function removeGroupMember(groupId: GroupId, userId: UserId) {
  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function changeGroupMemberRole(groupId: GroupId, userId: UserId, role: GroupRole) {
  const member = await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { role },
  });
  return GroupMemberSchema.parse(member);
}

export async function transferGroupOwnership(
  groupId: GroupId,
  currentOwnerId: UserId,
  newOwnerId: UserId
) {
  await prisma.$transaction(async (tx) => {
    await tx.group.update({ where: { id: groupId }, data: { ownerId: newOwnerId } });
    await tx.groupMember.update({
      where: { groupId_userId: { groupId, userId: currentOwnerId } },
      data: { role: 'ADMIN' },
    });
    await tx.groupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerId } },
      data: { role: 'OWNER' },
    });
  });
}
```

**Step 2: Build**

```bash
nx run mockingbird:build
```

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_server/groupService.ts
git commit -m "feat: add membership service functions (join, leave, remove, role change, transfer)"
```

---

### Task 12: Add Membership API routes

**Files:**
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/members/route.ts`
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/members/[userId]/route.ts`
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/transfer/route.ts`

**Step 1: Implement members routes**

Create `apps/mockingbird/src/app/api/groups/[groupId]/members/route.ts`:

```ts
import {
  getGroupById,
  getGroupMemberRole,
  getGroupMembers,
  addGroupMember,
  appendGroupAuditLog,
} from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);
    const role = await getGroupMemberRole(gid, userId);
    if (!role) throw new ResponseError(403, 'Not a member');
    const members = await getGroupMembers(gid);
    return NextResponse.json(members);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');
    if (group.visibility !== 'PUBLIC') throw new ResponseError(403, 'Group is private');
    if (group.status === 'DISABLED') throw new ResponseError(403, 'Group is disabled');

    const existing = await getGroupMemberRole(gid, userId);
    if (existing) throw new ResponseError(409, 'Already a member');

    const member = await addGroupMember(gid, userId, 'MEMBER');
    await appendGroupAuditLog(gid, userId, 'member.joined', userId);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

Create `apps/mockingbird/src/app/api/groups/[groupId]/members/[userId]/route.ts`:

```ts
import {
  getGroupById,
  getGroupMemberRole,
  removeGroupMember,
  changeGroupMemberRole,
  appendGroupAuditLog,
} from '@/_server/groupService';
import { GroupIdSchema, GroupRoleSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../../errors';
import { validateAuthentication } from '../../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string; userId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, userId: targetUserId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);
    const targetId = UserIdSchema.parse(targetUserId);

    const actorRole = await getGroupMemberRole(gid, actorId);
    const isSelf = actorId === targetId;

    if (!isSelf && actorRole !== 'ADMIN' && actorRole !== 'OWNER') {
      throw new ResponseError(403, 'Forbidden');
    }

    await removeGroupMember(gid, targetId);
    await appendGroupAuditLog(
      gid,
      actorId,
      isSelf ? 'member.left' : 'member.removed',
      targetId
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, userId: targetUserId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);
    const targetId = UserIdSchema.parse(targetUserId);

    const actorRole = await getGroupMemberRole(gid, actorId);
    if (actorRole !== 'ADMIN' && actorRole !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const { role } = z.object({ role: GroupRoleSchema }).parse(await req.json());

    // Only Owner can assign Owner or Admin role
    if ((role === 'OWNER' || role === 'ADMIN') && actorRole !== 'OWNER') {
      throw new ResponseError(403, 'Only the owner can assign Admin or Owner roles');
    }

    const member = await changeGroupMemberRole(gid, targetId, role);
    await appendGroupAuditLog(gid, actorId, 'member.role_changed', targetId, { role });

    return NextResponse.json(member);
  } catch (error) {
    return respondWithError(error);
  }
}
```

Create `apps/mockingbird/src/app/api/groups/[groupId]/transfer/route.ts`:

```ts
import {
  getGroupById,
  getGroupMemberRole,
  transferGroupOwnership,
  appendGroupAuditLog,
} from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const ownerId = UserIdSchema.parse(session.user?.id);

    const role = await getGroupMemberRole(gid, ownerId);
    if (role !== 'OWNER') throw new ResponseError(403, 'Only the owner can transfer ownership');

    const { newOwnerId } = z.object({ newOwnerId: UserIdSchema }).parse(await req.json());

    const newOwnerRole = await getGroupMemberRole(gid, newOwnerId);
    if (!newOwnerRole) throw new ResponseError(400, 'New owner must be an existing member');

    await transferGroupOwnership(gid, ownerId, newOwnerId);
    await appendGroupAuditLog(gid, ownerId, 'group.ownership_transferred', newOwnerId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 2: Build**

```bash
nx run mockingbird:build
```

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/api/groups/[groupId]/members/ apps/mockingbird/src/app/api/groups/[groupId]/transfer/
git commit -m "feat: add membership API routes (join, leave, remove, role change, transfer ownership)"
```

**Deploy Phase 4.**

---

## Phase 5 — Invites & Join Requests API

**Deployable result:** Private group invite and join-request flows are fully functional via API, including notifications.

---

### Task 13: Add invite and join request service functions

**Files:**
- Modify: `apps/mockingbird/src/_server/groupService.ts`

**Step 1: Append invite and join request functions**

```ts
export async function createGroupInvite(
  groupId: GroupId,
  invitedByUserId: UserId,
  invitedUserId: UserId
) {
  return prisma.groupInvite.create({
    data: { groupId, invitedByUserId, invitedUserId, status: 'PENDING' },
  });
}

export async function updateGroupInviteStatus(
  inviteId: string,
  status: 'ACCEPTED' | 'DECLINED'
) {
  return prisma.groupInvite.update({
    where: { id: inviteId },
    data: { status },
  });
}

export async function getGroupInvite(inviteId: string) {
  return prisma.groupInvite.findUnique({ where: { id: inviteId } });
}

export async function createGroupJoinRequest(groupId: GroupId, userId: UserId) {
  return prisma.groupJoinRequest.create({
    data: { groupId, userId, status: 'PENDING' },
  });
}

export async function updateGroupJoinRequestStatus(
  requestId: string,
  status: 'ACCEPTED' | 'DECLINED'
) {
  return prisma.groupJoinRequest.update({
    where: { id: requestId },
    data: { status },
  });
}

export async function getGroupJoinRequest(requestId: string) {
  return prisma.groupJoinRequest.findUnique({ where: { id: requestId } });
}

export async function getPendingJoinRequests(groupId: GroupId) {
  return prisma.groupJoinRequest.findMany({
    where: { groupId, status: 'PENDING' },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getPendingInvitesForGroup(groupId: GroupId) {
  return prisma.groupInvite.findMany({
    where: { groupId, status: 'PENDING' },
    include: { invitedUser: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });
}
```

**Step 2: Build**

```bash
nx run mockingbird:build
```

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_server/groupService.ts
git commit -m "feat: add invite and join request service functions"
```

---

### Task 14: Add Invite and Join Request API routes

**Files:**
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/invites/route.ts`
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/invites/[inviteId]/route.ts`
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/requests/route.ts`
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/requests/[requestId]/route.ts`

**Step 1: Implement invite routes**

Create `apps/mockingbird/src/app/api/groups/[groupId]/invites/route.ts`:

```ts
import {
  getGroupById,
  getGroupMemberRole,
  createGroupInvite,
  appendGroupAuditLog,
  getPendingInvitesForGroup,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);
    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');
    const invites = await getPendingInvitesForGroup(gid);
    return NextResponse.json(invites);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);

    const role = await getGroupMemberRole(gid, actorId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const { invitedUserId } = z.object({ invitedUserId: UserIdSchema }).parse(await req.json());

    const invite = await createGroupInvite(gid, actorId, invitedUserId);
    await appendGroupAuditLog(gid, actorId, 'invite.sent', invite.id);
    await createNotification({
      userId: invitedUserId,
      type: NotificationType.GROUP_INVITE,
      actorId,
      entityId: invite.id,
      metadata: { groupId: gid },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

Create `apps/mockingbird/src/app/api/groups/[groupId]/invites/[inviteId]/route.ts`:

```ts
import {
  getGroupById,
  getGroupInvite,
  updateGroupInviteStatus,
  addGroupMember,
  appendGroupAuditLog,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../../errors';
import { validateAuthentication } from '../../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string; inviteId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, inviteId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const invite = await getGroupInvite(inviteId);
    if (!invite || invite.groupId !== gid) throw new ResponseError(404, 'Invite not found');
    if (invite.invitedUserId !== userId) throw new ResponseError(403, 'Forbidden');
    if (invite.status !== 'PENDING') throw new ResponseError(409, 'Invite already resolved');

    const { status } = z.object({ status: z.enum(['ACCEPTED', 'DECLINED']) }).parse(await req.json());

    await updateGroupInviteStatus(inviteId, status);
    await appendGroupAuditLog(
      gid,
      userId,
      status === 'ACCEPTED' ? 'invite.accepted' : 'invite.declined',
      inviteId
    );

    if (status === 'ACCEPTED') {
      await addGroupMember(gid, userId, 'MEMBER');
      await appendGroupAuditLog(gid, userId, 'member.joined', userId);
      await createNotification({
        userId: invite.invitedByUserId as UserId,
        type: NotificationType.GROUP_INVITE_ACCEPTED,
        actorId: userId,
        entityId: inviteId,
        metadata: { groupId: gid },
      });
    } else {
      await createNotification({
        userId: invite.invitedByUserId as UserId,
        type: NotificationType.GROUP_INVITE_DECLINED,
        actorId: userId,
        entityId: inviteId,
        metadata: { groupId: gid },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

Create `apps/mockingbird/src/app/api/groups/[groupId]/requests/route.ts`:

```ts
import {
  getGroupById,
  getGroupMemberRole,
  createGroupJoinRequest,
  appendGroupAuditLog,
  getPendingJoinRequests,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);
    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');
    const requests = await getPendingJoinRequests(gid);
    return NextResponse.json(requests);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');
    if (group.visibility !== 'PRIVATE') throw new ResponseError(400, 'Group is public — join directly');
    if (group.status === 'DISABLED') throw new ResponseError(403, 'Group is disabled');

    const existing = await getGroupMemberRole(gid, userId);
    if (existing) throw new ResponseError(409, 'Already a member');

    const request = await createGroupJoinRequest(gid, userId);
    await appendGroupAuditLog(gid, userId, 'request.sent', request.id);

    // Notify group owner (simplified — full impl would notify all admins)
    await createNotification({
      userId: group.ownerId as UserId,
      type: NotificationType.GROUP_JOIN_REQUEST,
      actorId: userId,
      entityId: request.id,
      metadata: { groupId: gid },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

Create `apps/mockingbird/src/app/api/groups/[groupId]/requests/[requestId]/route.ts`:

```ts
import {
  getGroupJoinRequest,
  updateGroupJoinRequestStatus,
  getGroupMemberRole,
  addGroupMember,
  appendGroupAuditLog,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../../errors';
import { validateAuthentication } from '../../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string; requestId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, requestId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);

    const actorRole = await getGroupMemberRole(gid, actorId);
    if (actorRole !== 'ADMIN' && actorRole !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const request = await getGroupJoinRequest(requestId);
    if (!request || request.groupId !== gid) throw new ResponseError(404, 'Request not found');
    if (request.status !== 'PENDING') throw new ResponseError(409, 'Request already resolved');

    const { status } = z.object({ status: z.enum(['ACCEPTED', 'DECLINED']) }).parse(await req.json());

    await updateGroupJoinRequestStatus(requestId, status);
    await appendGroupAuditLog(
      gid,
      actorId,
      status === 'ACCEPTED' ? 'request.accepted' : 'request.declined',
      requestId
    );

    const requesterNotifType = status === 'ACCEPTED'
      ? NotificationType.GROUP_JOIN_REQUEST_ACCEPTED
      : NotificationType.GROUP_JOIN_REQUEST_DECLINED;

    if (status === 'ACCEPTED') {
      await addGroupMember(gid, request.userId as UserId, 'MEMBER');
      await appendGroupAuditLog(gid, actorId, 'member.joined', request.userId);
    }

    await createNotification({
      userId: request.userId as UserId,
      type: requesterNotifType,
      actorId,
      entityId: requestId,
      metadata: { groupId: gid },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 2: Build**

```bash
nx run mockingbird:build
```

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/api/groups/[groupId]/invites/ apps/mockingbird/src/app/api/groups/[groupId]/requests/
git commit -m "feat: add invite and join request API routes with notifications"
```

**Deploy Phase 5.**

---

## Phase 6 — Audit Log API

**Deployable result:** Admins can query the group audit log via API.

---

### Task 15: Add Audit Log API route

**Files:**
- Create: `apps/mockingbird/src/app/api/groups/[groupId]/audit/route.ts`

**Step 1: Add `getGroupAuditLog` to groupService**

Append to `apps/mockingbird/src/_server/groupService.ts`:

```ts
export async function getGroupAuditLog(groupId: GroupId, cursor?: string) {
  return prisma.groupAuditLog.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}
```

**Step 2: Implement route**

Create `apps/mockingbird/src/app/api/groups/[groupId]/audit/route.ts`:

```ts
import { getGroupMemberRole, getGroupAuditLog } from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
    const log = await getGroupAuditLog(gid, cursor);
    return NextResponse.json(log);
  } catch (error) {
    return respondWithError(error);
  }
}
```

**Step 3: Build and commit**

```bash
nx run mockingbird:build
git add apps/mockingbird/src/app/api/groups/[groupId]/audit/ apps/mockingbird/src/_server/groupService.ts
git commit -m "feat: add group audit log API route"
```

**Deploy Phase 6.**

---

## Phase 7 — Group Posts & Feed

**Deployable result:** Posts can be created targeting a group; the group feed returns those posts. The existing `feedService` stub is implemented.

---

### Task 16: Update Post types and `createPost` to support `groupId`

**Files:**
- Modify: `apps/mockingbird/src/_types/post.ts`
- Modify: `apps/mockingbird/src/_server/postsService.ts`

**Step 1: Update `CreatePostDataSchema`**

In `apps/mockingbird/src/_types/post.ts`:

```ts
import { GroupIdSchema } from './ids';

export const CreatePostDataSchema = z.object({
  posterId: UserIdSchema,
  responseToPostId: PostIdSchema.nullish(),
  audience: AudienceSchema,
  content: z.string().min(1, 'No Content'),
  groupId: GroupIdSchema.optional(),
});

export const PostSchema = CreatePostDataSchema.extend({
  id: PostIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  imageId: ImageIdSchema.nullish(),
  groupId: GroupIdSchema.nullish(),
  reactions: z.array(PostReactionSummarySchema).optional(),
});
```

**Step 2: Update `createPost` service**

In `apps/mockingbird/src/_server/postsService.ts`, update `createPost` signature:

```ts
import { GroupId } from '@/_types';

export async function createPost(
  posterId: UserId,
  audience: Audience,
  content: string,
  responseToPostId?: PostId | null,
  imageId?: ImageId,
  groupId?: GroupId
) {
  const data = {
    posterId,
    audience: groupId ? 'GROUP' as const : audience,
    content,
    responseToPostId,
    imageId,
    groupId,
  };

  const rawData = await prisma.post.create({ data });
  const post = PostSchema.parse(rawData);
  return post;
}
```

**Step 3: Update `POST /api/posts` route**

In `apps/mockingbird/src/app/api/posts/route.ts`, import group membership check and update handler:

```ts
import { getGroupById, getGroupMemberRole } from '@/_server/groupService';
import { GroupIdSchema } from '@/_types';

// Inside POST handler, replace the createPost call:
const body = NewPostFormDataSchema.parse(body_json);
const { posterId, content, imageId, audience, groupId } = body;

// Group access check
if (groupId) {
  const group = await getGroupById(groupId);
  if (!group) throw new ResponseError(404, 'Group not found');
  if (group.status === 'DISABLED') throw new ResponseError(403, 'Group is disabled');
  const role = await getGroupMemberRole(groupId, posterId);
  if (!role || role === 'LURKER') throw new ResponseError(403, 'Insufficient group permissions');
}

const post = await createPost(posterId, audience, content, null, imageId, groupId);
```

Also update `NewPostFormDataSchema` to include `groupId`:

```ts
const NewPostFormDataSchema = CreatePostDataSchema.extend({
  imageId: ImageIdSchema.optional(),
  groupId: GroupIdSchema.optional(),
});
```

**Step 4: Build**

```bash
nx run mockingbird:build
```

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_types/post.ts apps/mockingbird/src/_server/postsService.ts apps/mockingbird/src/app/api/posts/route.ts
git commit -m "feat: support groupId on Post creation; force GROUP audience when groupId present"
```

---

### Task 17: Implement group feed in `feedService`

**Files:**
- Modify: `apps/mockingbird/src/_server/feedService.ts`

**Step 1: Write failing test**

Create `apps/mockingbird/src/_server/__tests__/feedService.spec.ts`:

```ts
jest.mock('@/_server/db', () => ({
  prisma: {
    post: { findMany: jest.fn() },
    groupMember: { findUnique: jest.fn() },
  },
}));
jest.mock('@/_server/friendsService', () => ({
  getAcceptedFriendsForUser: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/_server/reactionService', () => ({
  groupPostReactions: jest.fn().mockReturnValue([]),
}));

// @ts-expect-error
import { prisma } from '@/_server/db';
import { getFeed } from '../feedService';

const groupMemberFindUniqueMock = jest.mocked(prisma.groupMember.findUnique);
const postFindManyMock = jest.mocked(prisma.post.findMany);

const USER_ID = 'cm1750szo00001ocb5aog8ley' as any;
const GROUP_ID = 'cm1srlg8f000014ng4h8nudwi';

describe('getFeed with groupId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns group feed for a member', async () => {
    groupMemberFindUniqueMock.mockResolvedValue({ role: 'MEMBER' } as any);
    postFindManyMock.mockResolvedValue([]);

    const result = await getFeed({ userId: USER_ID, feedSource: GROUP_ID });

    expect(groupMemberFindUniqueMock).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: GROUP_ID, userId: USER_ID } },
    });
    expect(postFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ groupId: GROUP_ID }) })
    );
    expect(result).toEqual([]);
  });

  it('throws if user is not a group member', async () => {
    groupMemberFindUniqueMock.mockResolvedValue(null);
    await expect(getFeed({ userId: USER_ID, feedSource: GROUP_ID })).rejects.toThrow();
  });
});
```

**Step 2: Run to verify it fails**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/feedService.spec.ts
```

Expected: FAIL.

**Step 3: Implement group feed in `feedService.ts`**

In `apps/mockingbird/src/_server/feedService.ts`, update the `getFeed` switch statement:

```ts
import { prisma } from '@/_server/db';

export async function getFeed({ userId, feedSource, cursor }: FeedOptions) {
  switch (feedSource) {
    case 'public':
      return getPublicFeed(cursor);
    case 'private':
      return getPrivateFeedForUser(userId);
    default:
      return getGroupFeed(userId, feedSource, cursor);
  }
}

async function getGroupFeed(userId: UserId, groupId: string, cursor?: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    throw new Error(`User ${userId} is not a member of group ${groupId}`);
  }

  const rawData = await prisma.post.findMany({
    where: { groupId, responseToPostId: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      reactions: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return parsePostsWithReactions(rawData);
}
```

**Step 4: Run tests**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/feedService.spec.ts
```

Expected: PASS.

**Step 5: Build**

```bash
nx run mockingbird:build
```

**Step 6: Commit**

```bash
git add apps/mockingbird/src/_server/feedService.ts apps/mockingbird/src/_server/__tests__/feedService.spec.ts
git commit -m "feat: implement group feed source in feedService"
```

**Deploy Phase 7.**

---

## Phase 8 — UI: Flock Discovery & Create

**Deployable result:** Users can browse, search, and create flocks.

---

### Task 18: Add `groupService` client-side API service

**Files:**
- Create: `apps/mockingbird/src/_apiServices/groups.ts`

**Step 1: Implement**

Create `apps/mockingbird/src/_apiServices/groups.ts`:

```ts
'use client';

import { fetchFromServer } from './fetchFromServer';
import { CreateGroup, Group, UpdateGroup } from '@/_types';

export async function searchGroups(query: string): Promise<Group[]> {
  return fetchFromServer(`/api/groups?q=${encodeURIComponent(query)}`);
}

export async function createGroup(data: CreateGroup): Promise<Group> {
  return fetchFromServer('/api/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getGroup(groupId: string): Promise<Group> {
  return fetchFromServer(`/api/groups/${groupId}`);
}

export async function updateGroup(groupId: string, data: UpdateGroup): Promise<Group> {
  return fetchFromServer(`/api/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function joinGroup(groupId: string): Promise<void> {
  return fetchFromServer(`/api/groups/${groupId}/members`, { method: 'POST' });
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  return fetchFromServer(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' });
}

export async function requestToJoinGroup(groupId: string): Promise<void> {
  return fetchFromServer(`/api/groups/${groupId}/requests`, { method: 'POST' });
}

export async function exportGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/export`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flock-${groupId}-export.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 2: Build**

```bash
nx run mockingbird:build
```

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_apiServices/groups.ts
git commit -m "feat: add groups client-side API service"
```

---

### Task 19: Build `/groups` discovery page

**Files:**
- Create: `apps/mockingbird/src/app/(routes)/groups/page.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/_components/GroupCard.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/_components/GroupSearch.client.tsx`

**Step 1: Create `GroupCard` server component**

Create `apps/mockingbird/src/app/(routes)/groups/_components/GroupCard.tsx`:

```tsx
import { Group } from '@/_types';
import Link from 'next/link';

type Props = { group: Group };

export function GroupCard({ group }: Props) {
  return (
    <Link href={`/groups/${group.id}`} className="card bg-base-200 shadow hover:shadow-md transition-shadow">
      <div className="card-body gap-2">
        <div className="flex items-center gap-3">
          {group.avatarUrl ? (
            <img src={group.avatarUrl} alt={group.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {group.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold">{group.name}</h3>
            {group.visibility === 'PRIVATE' && (
              <span className="badge badge-xs badge-neutral">Private</span>
            )}
          </div>
        </div>
        {group.description && (
          <p className="text-sm text-base-content/70 line-clamp-2">{group.description}</p>
        )}
      </div>
    </Link>
  );
}
```

**Step 2: Create `GroupSearch` client component**

Create `apps/mockingbird/src/app/(routes)/groups/_components/GroupSearch.client.tsx`:

```tsx
'use client';

import { Group } from '@/_types';
import { searchGroups } from '@/_apiServices/groups';
import { useState } from 'react';
import { GroupCard } from './GroupCard';

type Props = { initialGroups: Group[] };

export function GroupSearch({ initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    setLoading(true);
    try {
      const results = await searchGroups(q);
      setGroups(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search Flocks..."
        className="input input-bordered w-full"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {loading ? (
        <div className="flex justify-center py-8"><span className="loading loading-spinner" /></div>
      ) : groups.length === 0 ? (
        <p className="text-center text-base-content/50 py-8">No flocks found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => <GroupCard key={g.id} group={g} />)}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create `/groups` page**

Create `apps/mockingbird/src/app/(routes)/groups/page.tsx`:

```tsx
import { searchGroups } from '@/_server/groupService';
import Link from 'next/link';
import { GroupSearch } from './_components/GroupSearch.client';

export default async function GroupsPage() {
  const initialGroups = await searchGroups('');

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flocks</h1>
        <Link href="/groups/new" className="btn btn-primary btn-sm">
          Create a Flock
        </Link>
      </div>
      <GroupSearch initialGroups={initialGroups} />
    </div>
  );
}
```

**Step 4: Build**

```bash
nx run mockingbird:build
```

**Step 5: Commit**

```bash
git add apps/mockingbird/src/app/(routes)/groups/
git commit -m "feat: add /groups discovery page with search"
```

---

### Task 20: Build `/groups/new` create page

**Files:**
- Create: `apps/mockingbird/src/app/(routes)/groups/new/page.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/new/_components/CreateGroupForm.client.tsx`

**Step 1: Create the form**

Create `apps/mockingbird/src/app/(routes)/groups/new/_components/CreateGroupForm.client.tsx`:

```tsx
'use client';

import { createGroup } from '@/_apiServices/groups';
import { CreateGroup, CreateGroupSchema } from '@/_types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export function CreateGroupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroup>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: { visibility: 'PUBLIC' },
  });

  const onSubmit = async (data: CreateGroup) => {
    const group = await createGroup(data);
    router.push(`/groups/${group.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="form-control">
        <label className="label"><span className="label-text">Flock Name</span></label>
        <input {...register('name')} className="input input-bordered" placeholder="My Flock" />
        {errors.name && <span className="text-error text-sm">{errors.name.message}</span>}
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Description (optional)</span></label>
        <textarea {...register('description')} className="textarea textarea-bordered" rows={3} />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Visibility</span></label>
        <select {...register('visibility')} className="select select-bordered">
          <option value="PUBLIC">Public — anyone can join</option>
          <option value="PRIVATE">Private — invite only</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Create Flock'}
      </button>
    </form>
  );
}
```

**Step 2: Create the page**

Create `apps/mockingbird/src/app/(routes)/groups/new/page.tsx`:

```tsx
import { CreateGroupForm } from './_components/CreateGroupForm.client';

export default function NewGroupPage() {
  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Create a Flock</h1>
      <CreateGroupForm />
    </div>
  );
}
```

**Step 3: Build**

```bash
nx run mockingbird:build
```

**Step 4: Commit**

```bash
git add apps/mockingbird/src/app/(routes)/groups/new/
git commit -m "feat: add /groups/new create flock page"
```

**Deploy Phase 8.**

---

## Phase 9 — UI: Flock Home & Members

**Deployable result:** Users can view a flock's details, join/request-to-join, and see the member list.

---

### Task 21: Build `/groups/[groupId]` home page

**Files:**
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/page.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/GroupHeader.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/GroupJoinButton.client.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/MembersTab.tsx`

**Step 1: Create `GroupHeader`**

Create `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/GroupHeader.tsx`:

```tsx
import { Group } from '@/_types';

type Props = { group: Group; memberCount: number };

export function GroupHeader({ group, memberCount }: Props) {
  return (
    <div className="flex items-start gap-4">
      {group.avatarUrl ? (
        <img src={group.avatarUrl} alt={group.name} className="w-16 h-16 rounded-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
          {group.name[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.visibility === 'PRIVATE' && <span className="badge badge-neutral">Private</span>}
          {group.status === 'DISABLED' && <span className="badge badge-error">Disabled</span>}
        </div>
        <p className="text-base-content/60 text-sm">{memberCount} members</p>
        {group.description && <p className="text-base-content/80 mt-1">{group.description}</p>}
      </div>
    </div>
  );
}
```

**Step 2: Create `GroupJoinButton`**

Create `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/GroupJoinButton.client.tsx`:

```tsx
'use client';

import { joinGroup, requestToJoinGroup } from '@/_apiServices/groups';
import { Group } from '@/_types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { group: Group };

export function GroupJoinButton({ group }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      if (group.visibility === 'PUBLIC') {
        await joinGroup(group.id);
        router.refresh();
      } else {
        await requestToJoinGroup(group.id);
        setRequested(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (requested) return <p className="text-sm text-base-content/60">Request sent!</p>;

  return (
    <button className="btn btn-primary btn-sm" onClick={handleJoin} disabled={loading}>
      {loading ? <span className="loading loading-spinner loading-sm" /> :
        group.visibility === 'PUBLIC' ? 'Join Flock' : 'Request to Join'}
    </button>
  );
}
```

**Step 3: Create the group home page**

Create `apps/mockingbird/src/app/(routes)/groups/[groupId]/page.tsx`:

```tsx
import { getGroupById, getGroupMembers, getGroupMemberRole } from '@/_server/groupService';
import { auth } from '@/app/auth';
import { UserIdSchema, GroupIdSchema } from '@/_types';
import { notFound } from 'next/navigation';
import { GroupHeader } from './_components/GroupHeader';
import { GroupJoinButton } from './_components/GroupJoinButton.client';

type Props = { params: Promise<{ groupId: string }> };

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params;
  const session = await auth();
  const userId = UserIdSchema.parse(session?.user?.id);
  const gid = GroupIdSchema.parse(groupId);

  const group = await getGroupById(gid);
  if (!group) notFound();

  const members = await getGroupMembers(gid);
  const myRole = await getGroupMemberRole(gid, userId);
  const isMember = !!myRole;

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6">
      <GroupHeader group={group} memberCount={members.length} />

      {!isMember && group.status === 'ACTIVE' && <GroupJoinButton group={group} />}

      {isMember && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Members</h2>
          <ul className="flex flex-col gap-2">
            {members.map((m: any) => (
              <li key={m.id} className="flex items-center gap-3">
                {m.user.image && (
                  <img src={m.user.image} alt={m.user.name} className="w-8 h-8 rounded-full" />
                )}
                <span>{m.user.name}</span>
                <span className="badge badge-xs badge-ghost ml-auto">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Build**

```bash
nx run mockingbird:build
```

**Step 5: Commit**

```bash
git add apps/mockingbird/src/app/(routes)/groups/[groupId]/
git commit -m "feat: add /groups/[groupId] home page with join button and members list"
```

**Deploy Phase 9.**

---

## Phase 10 — UI: Group Feed & Post Composer

**Deployable result:** Members can view and post to the group feed; `FeedSelector` shows joined flocks.

---

### Task 22: Add group feed to the group page

**Files:**
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/GroupFeed.tsx`
- Modify: `apps/mockingbird/src/app/(routes)/groups/[groupId]/page.tsx`

**Step 1: Create `GroupFeed` component**

Create `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/GroupFeed.tsx`:

```tsx
import { getFeed } from '@/_server/feedService';
import { FeedList } from '@/_components/FeedList';
import { UserId, GroupId } from '@/_types';

type Props = { userId: UserId; groupId: GroupId };

export async function GroupFeed({ userId, groupId }: Props) {
  const posts = await getFeed({ userId, feedSource: groupId });
  return <FeedList posts={posts} />;
}
```

**Step 2: Wire into group home page**

In `apps/mockingbird/src/app/(routes)/groups/[groupId]/page.tsx`, inside the `isMember` block, add the feed above the members list:

```tsx
import { Suspense } from 'react';
import { GroupFeed } from './_components/GroupFeed';
import { SkeletonPostView } from '@/_components/SkeletonPostView';

// Inside isMember block, add before members section:
<div>
  <h2 className="text-lg font-semibold mb-3">Posts</h2>
  <Suspense fallback={<SkeletonPostView />}>
    <GroupFeed userId={userId} groupId={gid} />
  </Suspense>
</div>
```

**Step 3: Update post composer to accept `groupId`**

The existing post editor needs a `groupId` prop. Find the post editor component (in `_components/postEditor/`) and add an optional `groupId` prop that is included in the API request when present. When `groupId` is set, hide the audience selector.

Look at the current composer, then:
- Add `groupId?: GroupId` to its props
- Pass `groupId` through to the `createPost` API call
- Conditionally hide the `AudienceSelector` when `groupId` is set

Render the composer in the group page:
```tsx
import { PostEditor } from '@/_components/postEditor/PostEditor.client';

// Above GroupFeed, inside isMember block:
{myRole !== 'LURKER' && group.status === 'ACTIVE' && (
  <PostEditor groupId={gid} />
)}
```

**Step 4: Update `FeedSelector` to include user's joined flocks**

`FeedSelector` currently receives an optional `feeds` prop. Update the feed page (`src/app/(routes)/feed/page.tsx` or wherever the root feed is) to pass joined flocks as additional feed items:

```tsx
// In feed page (server component), fetch memberships:
const memberships = await prisma.groupMember.findMany({
  where: { userId },
  include: { group: { select: { id: true, name: true } } },
  orderBy: { joinedAt: 'desc' },
});

const groupFeeds = memberships.map((m) => ({
  key: m.group.id,
  label: `🐦 ${m.group.name}`,
}));

// Pass to FeedSelector:
<FeedSelector feeds={[...DEFAULT_FEEDS, ...groupFeeds]} />
```

**Step 5: Build**

```bash
nx run mockingbird:build
```

**Step 6: Commit**

```bash
git add apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/GroupFeed.tsx
git commit -m "feat: add group feed, group post composer, flock items in FeedSelector"
```

**Deploy Phase 10.**

---

## Phase 11 — UI: Admin Features (Requests, Invites, Audit Log, Settings)

**Deployable result:** Admins and owners can manage the flock — requests, invites, audit log, group settings.

---

### Task 23: Add admin tabs to group home (Requests, Invites, Audit Log)

**Files:**
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/RequestsTab.client.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/InvitesTab.client.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/AuditLogTab.tsx`

These are client-fetching components. Each fetches from the relevant API route and displays a list. Due to complexity, implement these as simple fetch-on-mount client components following the pattern of `FriendsContainer.client.tsx` in `src/app/(routes)/friends/`.

Render them inside the group home page when `myRole === 'ADMIN' || myRole === 'OWNER'`.

**Step 1: Build**

```bash
nx run mockingbird:build
```

**Step 2: Commit**

```bash
git add apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/RequestsTab.client.tsx
git add apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/InvitesTab.client.tsx
git add apps/mockingbird/src/app/(routes)/groups/[groupId]/_components/AuditLogTab.tsx
git commit -m "feat: add admin tabs (requests, invites, audit log) to group home"
```

---

### Task 24: Add `/groups/[groupId]/settings` page

**Files:**
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/settings/page.tsx`
- Create: `apps/mockingbird/src/app/(routes)/groups/[groupId]/settings/_components/GroupSettingsForm.client.tsx`

The settings page allows Owner/Admins to:
- Edit name, description, visibility (PATCH group)
- Owner only: disable/enable (status via PATCH), transfer ownership, hard-delete, export

Each action should confirm before executing (use `ConfirmationDialog` from the shared dialog library).

**Step 1: Build**

```bash
nx run mockingbird:build
```

**Step 2: Commit**

```bash
git add apps/mockingbird/src/app/(routes)/groups/[groupId]/settings/
git commit -m "feat: add /groups/[groupId]/settings page for owner/admin management"
```

---

### Task 25: Update notification display in Header

**Files:**
- Identify and modify the notification display component in `src/_components/Header.tsx` or the notification dropdown component

Currently the badge just shows a count. Update the dropdown (or notification panel) to:
1. Fetch `GET /api/notifications` on open
2. Render each notification based on its `type` string using a `getNotificationLabel(type, metadata)` helper
3. Mark individual notifications read via `PATCH /api/notifications/[id]`
4. "Mark all read" via `PATCH /api/notifications/all`

**Step 1: Create notification label helper**

Create `apps/mockingbird/src/_utils/notificationLabel.ts`:

```ts
import { NotificationType } from '@/_types';

export function getNotificationLabel(type: string, metadata?: Record<string, unknown>): string {
  switch (type) {
    case NotificationType.FRIEND_REQUEST: return 'sent you a friend request';
    case NotificationType.FRIEND_REQUEST_ACCEPTED: return 'accepted your friend request';
    case NotificationType.GROUP_INVITE: return 'invited you to a Flock';
    case NotificationType.GROUP_INVITE_ACCEPTED: return 'accepted your Flock invite';
    case NotificationType.GROUP_INVITE_DECLINED: return 'declined your Flock invite';
    case NotificationType.GROUP_JOIN_REQUEST: return 'requested to join your Flock';
    case NotificationType.GROUP_JOIN_REQUEST_ACCEPTED: return 'accepted your request to join';
    case NotificationType.GROUP_JOIN_REQUEST_DECLINED: return 'declined your request to join';
    case NotificationType.GROUP_OWNERSHIP_TRANSFERRED: return 'transferred Flock ownership to you';
    default: return 'sent you a notification';
  }
}
```

**Step 2: Build and commit**

```bash
nx run mockingbird:build
git add apps/mockingbird/src/_utils/notificationLabel.ts
git commit -m "feat: generalize notification display in header; add notification label helper"
```

**Deploy Phase 11. All phases complete.**

---

## Running All Tests

After each phase or before a PR:

```bash
nx run-many -t test
nx run mockingbird:build
nx run mockingbird:lint
```

E2E smoke tests (if server is running):

```bash
nx run mockingbird-e2e:e2e
```

---

## Migration Checklist for Each Deploy

1. Merge PR to `develop`
2. Vercel preview deploy triggers automatically
3. Run `prisma migrate deploy` against preview DB (see MEMORY.md — preview deploys require manual migration)
4. Verify app loads on preview URL
5. Promote to production (if applicable)
