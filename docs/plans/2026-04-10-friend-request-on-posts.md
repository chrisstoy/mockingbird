# Friend Request Affordance on Posts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add an inline "Add Friend" / "Pending..." affordance in the post and comment author header so users can send friend requests without leaving the feed.

**Architecture:** Server components (`SummaryPost`, `Comment`) fetch the friend status between the current user and the post author server-side, then pass it as props down to `PostHeader`, which renders a new `FriendAffordance.client.tsx` client component inline after the author name. The `Friends` DB model is migrated from a `Boolean` field to a `FriendRequestStatus` enum so the REJECTED state can persist.

**Tech Stack:** Next.js 15 App Router, Prisma 7 (CockroachDB), React 19, Tailwind/DaisyUI, Zod, Jest

---

## Task 1: Migrate Prisma Schema

**Files:**
- Modify: `apps/mockingbird/prisma/schema.prisma:192-202`

**Step 1: Update the schema**

Replace the `accepted Boolean` field with a `FriendRequestStatus` enum in `schema.prisma`:

```prisma
enum FriendRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model Friends {
  id        String              @id @default(cuid())
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt

  userId   String // user who makes the friend request
  friendId String // user to be friends with
  status   FriendRequestStatus @default(PENDING)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Step 2: Run migration**

```bash
DATABASE_URL=<your-local-db-url> npx prisma migrate dev --name friend_request_status --schema apps/mockingbird/prisma/schema.prisma
```

When prompted, write a custom migration or allow Prisma to generate it. Verify the generated SQL in `apps/mockingbird/prisma/migrations/` backfills existing rows:
- `accepted = true` → `status = 'ACCEPTED'`
- `accepted = false` → `status = 'PENDING'`

If Prisma doesn't generate backfill SQL automatically, manually add to the migration file:
```sql
UPDATE "Friends" SET "status" = 'ACCEPTED' WHERE "accepted" = true;
UPDATE "Friends" SET "status" = 'PENDING' WHERE "accepted" = false;
```

**Step 3: Regenerate Prisma client**

```bash
nx run mockingbird:prisma-generate
```

Expected: No errors, `apps/mockingbird/prisma/generated/` updated.

**Step 4: Commit**

```bash
git add apps/mockingbird/prisma/schema.prisma apps/mockingbird/prisma/migrations/
git commit -m "chore(MOC-84): migrate Friends schema to FriendRequestStatus enum"
```

---

## Task 2: Update `FriendStatus` Type

**Files:**
- Modify: `apps/mockingbird/src/_types/users.ts:59`
- Test: `apps/mockingbird/src/_types/__tests__/users.spec.ts`

**Step 1: Write the failing test**

Add to `apps/mockingbird/src/_types/__tests__/users.spec.ts`:

```typescript
import { FriendStatus } from '../users';

describe('FriendStatus', () => {
  it('includes rejected as a valid status', () => {
    const status: FriendStatus = 'rejected';
    expect(status).toBe('rejected');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
nx run mockingbird:test --testFile=src/_types/__tests__/users.spec.ts
```

Expected: TypeScript error — `'rejected'` is not assignable to `FriendStatus`.

**Step 3: Update `FriendStatus` in `users.ts`**

Change line 59:
```typescript
// Before:
export type FriendStatus = 'friend' | 'pending' | 'requested' | 'none';

// After:
export type FriendStatus = 'friend' | 'pending' | 'requested' | 'rejected' | 'none';
```

**Step 4: Run test to verify it passes**

```bash
nx run mockingbird:test --testFile=src/_types/__tests__/users.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_types/users.ts apps/mockingbird/src/_types/__tests__/users.spec.ts
git commit -m "feat(MOC-84): add 'rejected' to FriendStatus type"
```

---

## Task 3: Update `friendsService.ts` — Existing Query Functions

**Files:**
- Modify: `apps/mockingbird/src/_server/friendsService.ts`
- Test: `apps/mockingbird/src/_server/__tests__/friendsService.spec.ts`

**Context:** The service uses `AcceptedFriendsSchema` (a local Zod schema at line 89) that validates `accepted: boolean`. All filtering logic must be updated to use the new `status` enum. The `$transaction` mock in the test file also mocks `friends.create` and `friends.findFirst` — update the mock to return `status` instead of `accepted`.

**Step 1: Update the test mock to return `status`**

In `apps/mockingbird/src/_server/__tests__/friendsService.spec.ts`, update the mock and assertion to use `status`:

```typescript
jest.mock('@/_server/db', () => {
  return {
    prisma: {
      friends: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((fn) =>
        fn({
          friends: {
            create: jest.requireMock('@/_server/db').prisma.friends.create,
            findFirst: jest.requireMock('@/_server/db').prisma.friends.findFirst,
          },
        })
      ),
    },
  };
});

jest.mock('@/_server/logger', () => {
  return {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
    }),
  };
});

// @ts-expect-error - expect import error message
import { prisma } from '@/_server/db';
import { requestFriendshipBetweenUsers } from '../friendsService';

const friendsCreateMock = jest.mocked(prisma.friends.create);
const friendsFindFirstMock = jest.mocked(prisma.friends.findFirst);

describe('requestFriendshipBetweenUsers', () => {
  it('should return requested friendship with PENDING status', async () => {
    friendsFindFirstMock.mockResolvedValue(null);
    friendsCreateMock.mockResolvedValue({
      id: 'cm1750szo00001ocb5aog8ley',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      status: 'PENDING',
    });

    const result = await requestFriendshipBetweenUsers(
      'cm1750szo00001ocb5aog8ley',
      'cm1srlg8f000014ng4h8nudwi'
    );

    expect(result).toEqual({
      id: 'cm1750szo00001ocb5aog8ley',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      status: 'PENDING',
    });
    expect(friendsCreateMock).toHaveBeenCalledWith({
      data: { userId: 'cm1750szo00001ocb5aog8ley', friendId: 'cm1srlg8f000014ng4h8nudwi', status: 'PENDING' },
    });
  });

  it('should return null if friendship already exists', async () => {
    friendsFindFirstMock.mockResolvedValue({
      id: 'existing',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      status: 'PENDING',
    });

    const result = await requestFriendshipBetweenUsers(
      'cm1750szo00001ocb5aog8ley',
      'cm1srlg8f000014ng4h8nudwi'
    );

    expect(result).toBeNull();
    expect(friendsCreateMock).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/friendsService.spec.ts
```

Expected: FAIL — `accepted` field mismatch.

**Step 3: Update `friendsService.ts`**

Replace the entire file content with the updated version:

```typescript
import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import {
  FriendStatus,
  SimpleUserInfo,
  SimpleUserInfoSchema,
  UserId,
  UserIdSchema,
} from '@/_types';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'friends:service',
});

/**
 * Atomically check for an existing friendship/request and create one if absent.
 * Returns the new record, or null if a friendship/request already exists.
 */
export async function requestFriendshipBetweenUsers(
  userId: UserId,
  friendId: UserId
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.friends.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existing) {
      return null;
    }

    return tx.friends.create({
      data: { userId, friendId, status: 'PENDING' },
    });
  });
}

export async function updateFriendshipBetweenUsers(
  userId: UserId,
  friendId: UserId,
  accepted = true
) {
  const result = await prisma.friends.updateMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
    data: {
      status: accepted ? 'ACCEPTED' : 'REJECTED',
    },
  });
  return result.count;
}

export async function deleteFriendshipBetweenUsers(
  userId: UserId,
  friendId: UserId
) {
  const result = await prisma.friends.deleteMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });
  return result.count;
}

const FriendRecordSchema = z.array(
  z.object({
    userId: UserIdSchema.readonly(),
    friendId: UserIdSchema.readonly(),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).readonly(),
  })
);

export async function getAcceptedFriendsForUser(userId: UserId) {
  logger.info(`Getting accepted friends for userId: ${userId}`);

  const allFriends = FriendRecordSchema.parse(
    await prisma.friends.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
      select: {
        userId: true,
        friendId: true,
        status: true,
      },
    })
  );

  const acceptedFriendIds = allFriends
    .filter((friend) => friend.status === 'ACCEPTED')
    .map((friend) =>
      friend.userId === userId ? friend.friendId : friend.userId
    );

  return acceptedFriendIds;
}

/**
 * Return set of friends, pending requests, and friend requests for the given user
 */
export async function getFriendsForUser(userId: UserId) {
  logger.info(`Getting friends for userId: ${userId}`);

  const rawData = await prisma.friends.findMany({
    where: {
      OR: [{ userId }, { friendId: userId }],
    },
    select: {
      userId: true,
      friendId: true,
      status: true,
    },
  });

  const allFriends = FriendRecordSchema.parse(rawData);

  const acceptedFriendIds = allFriends
    .filter((friend) => friend.status === 'ACCEPTED')
    .map((friend) =>
      friend.userId === userId ? friend.friendId : friend.userId
    );

  const pendingFriendIds = allFriends
    .filter((friend) => friend.status === 'PENDING' && friend.userId === userId)
    .map(({ friendId }) => friendId);

  const friendRequestIds = allFriends
    .filter((friend) => friend.status === 'PENDING' && friend.friendId === userId)
    .map(({ userId }) => userId);

  const [rawFriends, rawPendingFriends, rawFriendRequests] =
    await prisma.$transaction([
      prisma.user.findMany({
        where: { id: { in: acceptedFriendIds as unknown as string[] } },
        select: { id: true, name: true, image: true },
      }),
      prisma.user.findMany({
        where: { id: { in: pendingFriendIds as unknown as string[] } },
        select: { id: true, name: true, image: true },
      }),
      prisma.user.findMany({
        where: { id: { in: friendRequestIds as unknown as string[] } },
        select: { id: true, name: true, image: true },
      }),
    ]);

  const friends = z.array(SimpleUserInfoSchema).parse(rawFriends);
  const pendingFriends = z.array(SimpleUserInfoSchema).parse(rawPendingFriends);
  const friendRequests = z.array(SimpleUserInfoSchema).parse(rawFriendRequests);

  return { friends, pendingFriends, friendRequests };
}

/**
 * Return set of users that the given user has sent friend requests to
 * and who have requested the user to be their friend
 */
export async function getFriendRequestsForUser(userId: UserId) {
  logger.info(`Getting friend requests for userId: ${userId}`);

  const PendingFriendRequestIdsSchema = z.array(
    z.object({ friendId: UserIdSchema })
  );

  const pendingFriendRequestIds = PendingFriendRequestIdsSchema.parse(
    await prisma.friends.findMany({
      where: { userId, status: 'PENDING' },
      select: { friendId: true },
    })
  );

  const pendingRequestsByUser = z.array(SimpleUserInfoSchema).parse(
    await prisma.user.findMany({
      where: { id: { in: pendingFriendRequestIds.map(({ friendId }) => friendId) } },
      select: { id: true, name: true, image: true },
    })
  );

  const RequestedToBeMyFriendSchema = z.array(
    z.object({ user: SimpleUserInfoSchema })
  );

  const requestedToBeMyFriend = RequestedToBeMyFriendSchema.parse(
    await prisma.friends.findMany({
      where: { friendId: userId, status: 'PENDING' },
      select: {
        user: { select: { id: true, name: true, image: true } },
      },
    })
  );

  return {
    pendingRequestsByUser,
    friendRequestsForUser: requestedToBeMyFriend.map<SimpleUserInfo>(
      ({ user }) => user
    ),
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/friendsService.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/friendsService.ts apps/mockingbird/src/_server/__tests__/friendsService.spec.ts
git commit -m "feat(MOC-84): update friendsService queries to use FriendRequestStatus enum"
```

---

## Task 4: Add `getFriendStatusBetweenUsers` Service Function

**Files:**
- Modify: `apps/mockingbird/src/_server/friendsService.ts` (append)
- Test: `apps/mockingbird/src/_server/__tests__/friendsService.spec.ts` (add describe block)

**Step 1: Write the failing tests**

Add to `apps/mockingbird/src/_server/__tests__/friendsService.spec.ts`:

```typescript
import { getFriendStatusBetweenUsers } from '../friendsService';

const friendsFindManyMock = jest.mocked(prisma.friends.findFirst);

describe('getFriendStatusBetweenUsers', () => {
  const ME = 'cm1750szo00001ocb5aog8ley' as UserId;
  const THEM = 'cm1srlg8f000014ng4h8nudwi' as UserId;

  beforeEach(() => jest.clearAllMocks());

  it('returns none when no record exists', async () => {
    friendsFindFirstMock.mockResolvedValue(null);
    expect(await getFriendStatusBetweenUsers(ME, THEM)).toBe('none');
  });

  it('returns friend when ACCEPTED', async () => {
    friendsFindFirstMock.mockResolvedValue({ userId: ME, friendId: THEM, status: 'ACCEPTED' });
    expect(await getFriendStatusBetweenUsers(ME, THEM)).toBe('friend');
  });

  it('returns pending when I sent and status is PENDING', async () => {
    friendsFindFirstMock.mockResolvedValue({ userId: ME, friendId: THEM, status: 'PENDING' });
    expect(await getFriendStatusBetweenUsers(ME, THEM)).toBe('pending');
  });

  it('returns requested when they sent and status is PENDING', async () => {
    friendsFindFirstMock.mockResolvedValue({ userId: THEM, friendId: ME, status: 'PENDING' });
    expect(await getFriendStatusBetweenUsers(ME, THEM)).toBe('requested');
  });

  it('returns rejected when I sent and they rejected', async () => {
    friendsFindFirstMock.mockResolvedValue({ userId: ME, friendId: THEM, status: 'REJECTED' });
    expect(await getFriendStatusBetweenUsers(ME, THEM)).toBe('rejected');
  });

  it('returns none when they sent and I rejected (they can re-request)', async () => {
    friendsFindFirstMock.mockResolvedValue({ userId: THEM, friendId: ME, status: 'REJECTED' });
    expect(await getFriendStatusBetweenUsers(ME, THEM)).toBe('none');
  });
});
```

Note: you'll need to import `UserId` at the top of the test file:
```typescript
import { UserId } from '@/_types';
```

**Step 2: Run tests to verify they fail**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/friendsService.spec.ts
```

Expected: FAIL — `getFriendStatusBetweenUsers` is not exported.

**Step 3: Implement the function**

Append to `apps/mockingbird/src/_server/friendsService.ts`:

```typescript
/**
 * Return the friend status between two users from currentUserId's perspective.
 * Used server-side to determine what affordance to show in post/comment headers.
 */
export async function getFriendStatusBetweenUsers(
  currentUserId: UserId,
  authorId: UserId
): Promise<FriendStatus> {
  const record = await prisma.friends.findFirst({
    where: {
      OR: [
        { userId: currentUserId, friendId: authorId },
        { userId: authorId, friendId: currentUserId },
      ],
    },
    select: { userId: true, friendId: true, status: true },
  });

  if (!record) return 'none';
  if (record.status === 'ACCEPTED') return 'friend';
  if (record.status === 'REJECTED') {
    // I sent the request and was rejected → hide affordance
    // I rejected their request → they can re-request me
    return record.userId === currentUserId ? 'rejected' : 'none';
  }
  // PENDING
  return record.userId === currentUserId ? 'pending' : 'requested';
}
```

**Step 4: Run tests to verify they pass**

```bash
nx run mockingbird:test --testFile=src/_server/__tests__/friendsService.spec.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/friendsService.ts apps/mockingbird/src/_server/__tests__/friendsService.spec.ts
git commit -m "feat(MOC-84): add getFriendStatusBetweenUsers service function"
```

---

## Task 5: Fix API Route POST Handler Bug

**Files:**
- Modify: `apps/mockingbird/src/app/api/users/[userId]/friends/[friendId]/route.ts:42`

**Context:** There is an existing bug on line 42 — `updateFriendshipBetweenUsers(userId, friendId)` is called without passing `accepted`, so the function always defaults to `accepted = true` (ACCEPTED). Rejection on the Friends page was broken before this PR. Fix it by passing `accepted`.

**Step 1: Fix the POST handler**

Change line 42:
```typescript
// Before (buggy):
const recordsUpdated = await updateFriendshipBetweenUsers(userId, friendId);

// After:
const recordsUpdated = await updateFriendshipBetweenUsers(userId, friendId, accepted);
```

**Step 2: Run lint to verify no issues**

```bash
nx run mockingbird:lint
```

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/api/users/[userId]/friends/[friendId]/route.ts
git commit -m "fix(MOC-84): pass accepted param to updateFriendshipBetweenUsers in POST handler"
```

---

## Task 6: Add `rejectFriendRequest` to API Service

**Files:**
- Modify: `apps/mockingbird/src/_apiServices/friends.ts`

**Step 1: Add the function**

Append to `apps/mockingbird/src/_apiServices/friends.ts` after `acceptFriendRequest`:

```typescript
export async function rejectFriendRequest(userId: UserId, friendId: UserId) {
  try {
    const response = await fetchFromServer(
      `/users/${userId}/friends/${friendId}`,
      {
        method: 'POST',
        body: JSON.stringify({ accepted: false }),
      }
    );
    const rawData = await response.json();
    return rawData;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
nx run mockingbird:build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_apiServices/friends.ts
git commit -m "feat(MOC-84): add rejectFriendRequest API service function"
```

---

## Task 7: Update `FriendCard` Rejection Behavior

**Files:**
- Modify: `apps/mockingbird/src/app/(routes)/friends/_components/FriendCard.client.tsx:57-62`

**Context:** Currently rejection calls `removeFriend` (DELETE), which deletes the record. After this change, rejection must call `rejectFriendRequest` (POST `{ accepted: false }`) so the REJECTED record persists in the DB.

**Step 1: Update the import and handler**

In `FriendCard.client.tsx`:

1. Add `rejectFriendRequest` to the import on line 2:
```typescript
import {
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  requestFriend,
} from '@/_apiServices/friends';
```

2. Update `handleRejectFriendRequest` (lines 57-62):
```typescript
const handleRejectFriendRequest = useCallback(async () => {
  if (!userId) return;
  await rejectFriendRequest(userId, friendId);  // was: removeFriend
  onFriendStatusChange(friendId, 'none');
  router.refresh();
}, [userId, friendId, onFriendStatusChange, router]);
```

**Step 2: Run lint**

```bash
nx run mockingbird:lint
```

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/(routes)/friends/_components/FriendCard.client.tsx
git commit -m "feat(MOC-84): update FriendCard to persist REJECTED status on rejection"
```

---

## Task 8: Create `FriendAffordance.client.tsx`

**Files:**
- Create: `apps/mockingbird/src/_components/FriendAffordance.client.tsx`

**Step 1: Create the component**

```typescript
'use client';
import { requestFriend } from '@/_apiServices/friends';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { FriendStatus, UserId } from '@/_types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  authorId: UserId;
  initialStatus: FriendStatus;
}

export function FriendAffordance({ authorId, initialStatus }: Props) {
  const user = useSessionUser();
  const router = useRouter();
  const [status, setStatus] = useState<FriendStatus>(initialStatus);

  if (status === 'none') {
    return (
      <button
        onClick={async () => {
          if (!user?.id) return;
          await requestFriend(user.id, authorId);
          setStatus('pending');
        }}
        className="text-xs text-primary hover:underline font-medium shrink-0"
      >
        Add Friend
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button
        onClick={() => router.push('/friends')}
        className="text-xs text-base-content/40 hover:underline font-medium shrink-0"
      >
        Pending...
      </button>
    );
  }

  return null;
}
```

**Step 2: Verify TypeScript compiles**

```bash
nx run mockingbird:build
```

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_components/FriendAffordance.client.tsx
git commit -m "feat(MOC-84): create FriendAffordance client component"
```

---

## Task 9: Update `PostHeader` to Render `FriendAffordance`

**Files:**
- Modify: `apps/mockingbird/src/_components/PostHeader.tsx`

**Step 1: Update the component**

Replace the full file content:

```typescript
import { toLocalTime } from '@/_apiServices/toLocalTime';
import { Audience, FriendStatus, PostId, UserId } from '@/_types';
import { toCapitalized } from '@/_utils/toCapitalized';
import { FriendAffordance } from './FriendAffordance.client';
import { PostMenu } from './PostMenu.client';

type Props = {
  date: Date;
  image: string;
  name: string;
  postId: PostId;

  authorId?: UserId;
  friendStatus?: FriendStatus;
  isComment?: boolean;
  showOptionsMenu?: boolean;
  small?: boolean;
  audience?: Audience;
};

function nameToHandle(name: string) {
  return '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function PostHeader({
  date,
  image,
  name,
  postId,
  audience,
  authorId,
  friendStatus,
  isComment = false,
  showOptionsMenu = false,
  small = false,
}: Props) {
  return (
    <div className="flex flex-row items-start">
      <div className="flex flex-row flex-auto gap-3">
        <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden flex-shrink-0`}>
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-base-content truncate ${small ? 'text-sm' : 'text-sm'}`}>
              {name}
            </span>
            {authorId && friendStatus && (
              <FriendAffordance authorId={authorId} initialStatus={friendStatus} />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-base-content/40">
            <span>{nameToHandle(name)}</span>
            <span>·</span>
            <span>{toLocalTime(date)}</span>
            {audience && (
              <>
                <span>·</span>
                <span>{toCapitalized(audience)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {showOptionsMenu && (
        <PostMenu isComment={isComment} postId={postId} />
      )}
    </div>
  );
}
```

**Step 2: Run lint**

```bash
nx run mockingbird:lint
```

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_components/PostHeader.tsx
git commit -m "feat(MOC-84): add FriendAffordance to PostHeader"
```

---

## Task 10: Update `SummaryPost` to Pass Friend Status

**Files:**
- Modify: `apps/mockingbird/src/_components/SummaryPost.tsx`

**Step 1: Update the component**

Add `getFriendStatusBetweenUsers` import and fetch logic. Updated file:

```typescript
import {
  getCommentsForPost,
  getNumberOfCommentsForPost,
} from '@/_server/postsService';
import { getFriendStatusBetweenUsers } from '@/_server/friendsService';
import { getUserById } from '@/_server/usersService';
import { Post } from '@/_types';
import { auth } from '@/app/auth';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { TextDisplay } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { Suspense } from 'react';
import { CommentList } from './CommentList';
import { ImageDisplay } from './ImageDisplay.client';
import { PostActionsFooter } from './PostActionsFooter';
import { PostHeader } from './PostHeader';
import { SkeletonComment } from './SkeletonComment';

type Props = {
  post: Post;
  linkToDetails?: boolean;
  showFirstComment?: boolean;
};

export async function SummaryPost({
  post,
  linkToDetails = false,
  showFirstComment = false,
}: Props) {
  const session = await auth();
  const poster = await getUserById(post.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? GENERIC_USER_IMAGE_URL;

  const currentUserId = session?.user?.id;
  const isSelf = currentUserId === post.posterId;

  const showOptionsMenu = isSelf;

  const friendStatus =
    currentUserId && !isSelf
      ? await getFriendStatusBetweenUsers(currentUserId, post.posterId)
      : undefined;

  const comments =
    (await getCommentsForPost(post.id, showFirstComment ? 1 : undefined)) ?? [];

  const numberOfComments = await getNumberOfCommentsForPost(post.id);

  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <PostHeader
          name={userName}
          image={imageSrc}
          date={post.createdAt}
          postId={post.id}
          showOptionsMenu={showOptionsMenu}
          audience={post.audience}
          authorId={isSelf ? undefined : post.posterId}
          friendStatus={friendStatus}
        />
      </div>

      {linkToDetails ? (
        <Link href={`/post/${post.id}`} className="block hover:bg-base-50 transition-colors">
          <div className="px-4 pb-3">
            <ImageDisplay imageId={post.imageId} />
            <TextDisplay data={post.content} />
          </div>
        </Link>
      ) : (
        <div className="px-4 pb-3">
          <ImageDisplay imageId={post.imageId} />
          <TextDisplay data={post.content} />
        </div>
      )}

      <PostActionsFooter post={post} numberOfComments={numberOfComments} />

      <Suspense
        fallback={
          <div className="px-4 pb-3">
            <SkeletonComment />
          </div>
        }
      >
        <CommentList
          feed={comments}
          originalPost={post}
          linkToDetails={linkToDetails}
          hideReplies={showFirstComment}
        />
      </Suspense>
    </div>
  );
}
```

**Step 2: Run lint and build**

```bash
nx run mockingbird:lint && nx run mockingbird:build
```

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/_components/SummaryPost.tsx
git commit -m "feat(MOC-84): pass friend status to PostHeader in SummaryPost"
```

---

## Task 11: Update `Comment` to Pass Friend Status

**Files:**
- Modify: `apps/mockingbird/src/_components/Comment.tsx`

**Step 1: Update the component**

```typescript
import { sessionUser } from '@/_hooks/sessionUser';
import { getFriendStatusBetweenUsers } from '@/_server/friendsService';
import { getUserById } from '@/_server/usersService';
import { Post } from '@/_types';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { TextDisplay } from '@mockingbird/stoyponents';
import Link from 'next/link';
import { CommentReplyContainer } from './CommentReplyContainer.client';
import { ImageDisplay } from './ImageDisplay.client';
import { PostHeader } from './PostHeader';

type Props = {
  comment: Post;
  originalPost: Post;
  linkToDetails?: boolean;
  hideReplies?: boolean;
};

export async function Comment({
  comment,
  originalPost,
  linkToDetails = false,
  hideReplies = false,
}: Props) {
  const user = await sessionUser();
  if (!user) {
    return null;
  }
  const poster = await getUserById(comment.posterId);

  const userName = poster?.name ?? 'Unknown';
  const imageSrc = poster?.image ?? GENERIC_USER_IMAGE_URL;

  const isSelf = comment.posterId === user.id;
  const showOptionsMenu =
    isSelf || originalPost.posterId === user.id;

  const friendStatus =
    !isSelf
      ? await getFriendStatusBetweenUsers(user.id, comment.posterId)
      : undefined;

  const renderContent = () => (
    <>
      <PostHeader
        name={userName}
        image={imageSrc}
        date={comment.createdAt}
        postId={comment.id}
        small
        isComment
        showOptionsMenu={showOptionsMenu}
        authorId={isSelf ? undefined : comment.posterId}
        friendStatus={friendStatus}
      />
      <div className="text-sm bg-transparent rounded-lg my-1">
        <ImageDisplay imageId={comment.imageId} />
        <TextDisplay data={comment.content} />
      </div>
    </>
  );

  return (
    <div className={`card card-compact bg-base-100 shadow-md ml-4`}>
      <div
        className={`card-body rounded-lg ${
          linkToDetails && 'hover:bg-base-200'
        }`}
      >
        {linkToDetails ? (
          <Link href={`/post/${originalPost.id}`}>{renderContent()}</Link>
        ) : (
          <div>{renderContent()}</div>
        )}
      </div>

      <CommentReplyContainer
        hideReplies={hideReplies}
        originalComment={comment}
        replyingToName={userName}
        originalPosterId={originalPost.posterId}
      />
    </div>
  );
}
```

**Step 2: Run all tests and lint**

```bash
nx run mockingbird:lint && nx run mockingbird:test
```

Expected: All pass.

**Step 3: Update reference docs**

Update `.claude/reference/data-model.md` to document the new `FriendRequestStatus` enum and the removal of the `accepted` boolean.

Update `.claude/reference/features-api.md` to document `getFriendStatusBetweenUsers` in the friends service section.

Update `.claude/reference/features-web-app.md` to document the new `FriendAffordance` component and where it appears.

**Step 4: Commit**

```bash
git add apps/mockingbird/src/_components/Comment.tsx .claude/reference/
git commit -m "feat(MOC-84): pass friend status to PostHeader in Comment"
```

---

## Verification Checklist

1. Start dev server: `nx run mockingbird:dev`
2. Log in as User A, view a post by User B (no prior relationship) → "Add Friend" appears inline after B's name
3. Click "Add Friend" → changes to "Pending..." immediately (no page reload)
4. Refresh → still shows "Pending..."
5. Click "Pending..." → navigates to `/friends`
6. Log in as User B, go to Friends page, accept A's request
7. Log in as User A, view B's post → no affordance shown
8. Log in as User B again, reject a different pending request
9. Log in as the rejected user, view B's post → no affordance shown (REJECTED persists)
10. View your own posts → no affordance shown
11. View a comment by User C (non-friend) → "Add Friend" appears in comment header too
