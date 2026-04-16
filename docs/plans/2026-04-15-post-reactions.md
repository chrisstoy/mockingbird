# Post Reactions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to react to any post, comment, or reply with one of six emoji reactions (one per user; auto-replace or toggle off).

**Architecture:** Add a `PostReaction` model with a composite PK `@@id([postId, userId])` enforcing one-reaction-per-user at the DB level. Upsert handles auto-replace. A `groupPostReactions` helper transforms flat DB rows into grouped summaries. The `Post` type gains an optional `reactions` field; all service functions that serve the UI include reactions via Prisma `include`. A `ReactionsBar.client.tsx` component handles optimistic UI and calls two new API routes.

**Tech Stack:** Prisma 7 (CockroachDB), Zod, Next.js App Router API routes, React 19 client component, DaisyUI, `router.refresh()` for revalidation.

---

## Task 1: DB Schema — Remove stub fields, add PostReaction model

**Files:**
- Modify: `apps/mockingbird/prisma/schema.prisma`

**Step 1: Update schema.prisma**

In the `Post` model, **remove** these two lines:
```prisma
likeCount    Int      @default(0)
dislikeCount Int      @default(0)
```

Add the `reactions` relation to the `Post` model (after the `image` relation):
```prisma
reactions PostReaction[]
```

Add the `reactions` relation to the `User` model (after `permissionOverrides`):
```prisma
reactions PostReaction[]
```

Add the `ReactionType` enum and `PostReaction` model to the `// #region Mockingbird` section (after the `Post` model):

```prisma
enum ReactionType {
  THUMBS_UP
  THUMBS_DOWN
  CHEER
  ANGER
  LAUGH
  HUGS
}

model PostReaction {
  postId    String
  userId    String
  reaction  ReactionType
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([postId, userId])
  @@index([postId])
}
```

**Step 2: Run migration**

From `apps/mockingbird/` directory:
```bash
DATABASE_URL=<your-db-url> npx prisma migrate dev --name add-post-reactions
```

Expected output: `The following migration(s) have been applied: .../add-post-reactions/migration.sql`

**Step 3: Regenerate Prisma client**

```bash
nx run mockingbird:prisma-generate
```

Expected output: `Generated Prisma Client` with no errors.

**Step 4: Commit**

```bash
git add apps/mockingbird/prisma/schema.prisma apps/mockingbird/prisma/migrations/
git commit -m "feat: add PostReaction model, remove likeCount/dislikeCount stubs"
```

---

## Task 2: Zod Types — Add ReactionType and PostReactionSummary, update PostSchema

**Files:**
- Create: `apps/mockingbird/src/_types/reactions.ts`
- Modify: `apps/mockingbird/src/_types/ids.ts`
- Modify: `apps/mockingbird/src/_types/post.ts`
- Modify: `apps/mockingbird/src/_types/index.ts`

**Step 1: Create `reactions.ts`**

```ts
// apps/mockingbird/src/_types/reactions.ts
import { z } from 'zod';
import { UserIdSchema } from './ids';

export const ReactionTypeSchema = z.enum([
  'THUMBS_UP',
  'THUMBS_DOWN',
  'CHEER',
  'ANGER',
  'LAUGH',
  'HUGS',
]);
export type ReactionType = z.infer<typeof ReactionTypeSchema>;

export const PostReactionUserSchema = z.object({
  id: UserIdSchema,
  name: z.string(),
  image: z.string().nullable(),
});
export type PostReactionUser = z.infer<typeof PostReactionUserSchema>;

export const PostReactionSummarySchema = z.object({
  type: ReactionTypeSchema,
  count: z.number(),
  users: z.array(PostReactionUserSchema),
});
export type PostReactionSummary = z.infer<typeof PostReactionSummarySchema>;

export const SetReactionSchema = z.object({
  reaction: ReactionTypeSchema,
});
export type SetReaction = z.infer<typeof SetReactionSchema>;
```

**Step 2: Update `ids.ts` — add PostReactionId**

Add after the last existing ID type:
```ts
export type PostReactionId = string & { __brand: 'PostReactionId' };
export const PostReactionIdSchema = createDatabaseIdSchema<PostReactionId>();
```

**Step 3: Update `post.ts` — remove likeCount/dislikeCount, add reactions**

Replace the file with:
```ts
import { z } from 'zod';
import { AudienceSchema } from './audience';
import { ImageIdSchema, PostIdSchema, UserIdSchema } from './ids';
import { PostReactionSummarySchema } from './reactions';

export const CreatePostDataSchema = z.object({
  posterId: UserIdSchema,
  responseToPostId: PostIdSchema.nullish(),
  audience: AudienceSchema,
  content: z.string().min(1, 'No Content'),
});
export type CreatePost = z.infer<typeof CreatePostDataSchema>;

export const PostSchema = CreatePostDataSchema.extend({
  id: PostIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  imageId: ImageIdSchema.nullish(),
  reactions: z.array(PostReactionSummarySchema).optional(),
});
export type Post = z.infer<typeof PostSchema>;
```

**Step 4: Update `index.ts` — export reactions**

Add this line after `export * from './post';`:
```ts
export * from './reactions';
```

**Step 5: Run type-check to confirm no type errors**

```bash
nx run mockingbird:build 2>&1 | head -50
```

Expected: build proceeds past type-checking (may fail at runtime for unrelated reasons — just confirm no TS errors on the files we changed).

**Step 6: Commit**

```bash
git add apps/mockingbird/src/_types/
git commit -m "feat: add ReactionType and PostReactionSummary types, remove likeCount/dislikeCount from PostSchema"
```

---

## Task 3: Fix broken test — update postsService.spec.ts

**Files:**
- Modify: `apps/mockingbird/src/_server/__tests__/postsService.spec.ts`

The existing mock in `postsService.spec.ts` returns `likeCount` and `dislikeCount` which no longer exist on the schema. Remove them.

**Step 1: Run the tests to confirm they fail**

```bash
nx run mockingbird:test --testPathPattern="postsService" --skip-nx-cache
```

Expected: FAIL — `likeCount` / `dislikeCount` are not recognized by `PostSchema`.

**Step 2: Update the mock implementation**

In the `postsCreateMock.mockImplementation` callback, remove the `likeCount: 0` and `dislikeCount: 0` lines:

```ts
postsCreateMock.mockImplementation(({ data }) => {
  return Promise.resolve({
    id: 'cm5t7b2da0001nkm167ecyq58',
    createdAt: '2025-01-12T05:55:14.481Z',
    updatedAt: '2025-01-12T05:55:14.481Z',

    posterId: data.posterId,
    audience: data.audience,
    content: data.content,
    responseToPostId: data.responseToPostId,
    imageId: data.imageId,
  });
});
```

**Step 3: Run tests to confirm they pass**

```bash
nx run mockingbird:test --testPathPattern="postsService" --skip-nx-cache
```

Expected: PASS — 3 tests pass.

**Step 4: Commit**

```bash
git add apps/mockingbird/src/_server/__tests__/postsService.spec.ts
git commit -m "fix: update postsService test mock to remove likeCount/dislikeCount"
```

---

## Task 4: Add reactionService (server) with grouping helper + tests

**Files:**
- Create: `apps/mockingbird/src/_server/reactionService.ts`
- Create: `apps/mockingbird/src/_server/__tests__/reactionService.spec.ts`

**Step 1: Write the failing tests first**

Create `apps/mockingbird/src/_server/__tests__/reactionService.spec.ts`:

```ts
import { PrismaClient } from '../../../prisma/generated/client.js';

jest.mock('@/_server/db', () => ({
  prisma: {
    postReaction: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    } as Partial<PrismaClient['postReaction']>,
  },
}));

jest.mock('@/_server/logger', () => ({
  child: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

// @ts-expect-error - mocked module
import { prisma } from '@/_server/db';
import {
  setReaction,
  removeReaction,
  getReactionsForPost,
  groupPostReactions,
} from '../reactionService';

const upsertMock = jest.mocked<PrismaClient['postReaction']['upsert']>(
  prisma.postReaction.upsert
);
const deleteMock = jest.mocked<PrismaClient['postReaction']['delete']>(
  prisma.postReaction.delete
);
const findManyMock = jest.mocked<PrismaClient['postReaction']['findMany']>(
  prisma.postReaction.findMany
);

const mockPostId = 'mock-post-id-000001';
const mockUserId = 'mock-user-id-000001';

describe('groupPostReactions', () => {
  it('groups flat reactions into summaries by type', () => {
    const raw = [
      { userId: 'user-id-000001', reaction: 'THUMBS_UP', user: { id: 'user-id-000001', name: 'Alice', image: null } },
      { userId: 'user-id-000002', reaction: 'THUMBS_UP', user: { id: 'user-id-000002', name: 'Bob', image: 'http://example.com/img.jpg' } },
      { userId: 'user-id-000003', reaction: 'LAUGH', user: { id: 'user-id-000003', name: 'Carol', image: null } },
    ] as Parameters<typeof groupPostReactions>[0];

    const result = groupPostReactions(raw);

    expect(result).toHaveLength(2);

    const thumbsUp = result.find((r) => r.type === 'THUMBS_UP');
    expect(thumbsUp).toBeDefined();
    expect(thumbsUp!.count).toBe(2);
    expect(thumbsUp!.users).toHaveLength(2);

    const laugh = result.find((r) => r.type === 'LAUGH');
    expect(laugh).toBeDefined();
    expect(laugh!.count).toBe(1);
  });

  it('returns empty array for no reactions', () => {
    expect(groupPostReactions([])).toEqual([]);
  });
});

describe('setReaction', () => {
  it('calls upsert with correct args', async () => {
    upsertMock.mockResolvedValueOnce({} as never);

    await setReaction(mockPostId as never, mockUserId as never, 'THUMBS_UP');

    expect(upsertMock).toHaveBeenCalledWith({
      where: { postId_userId: { postId: mockPostId, userId: mockUserId } },
      update: { reaction: 'THUMBS_UP' },
      create: { postId: mockPostId, userId: mockUserId, reaction: 'THUMBS_UP' },
    });
  });
});

describe('removeReaction', () => {
  it('calls delete with correct args', async () => {
    deleteMock.mockResolvedValueOnce({} as never);

    await removeReaction(mockPostId as never, mockUserId as never);

    expect(deleteMock).toHaveBeenCalledWith({
      where: { postId_userId: { postId: mockPostId, userId: mockUserId } },
    });
  });

  it('throws if reaction does not exist', async () => {
    const { PrismaClientKnownRequestError } = jest.requireActual(
      '../../../prisma/generated/client.js'
    ) as typeof import('../../../prisma/generated/client.js');

    deleteMock.mockRejectedValueOnce(
      new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      })
    );

    await expect(
      removeReaction(mockPostId as never, mockUserId as never)
    ).rejects.toThrow();
  });
});

describe('getReactionsForPost', () => {
  it('returns grouped reactions', async () => {
    findManyMock.mockResolvedValueOnce([
      {
        postId: mockPostId,
        userId: 'user-id-000001',
        reaction: 'HUGS',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-id-000001', name: 'Alice', image: null },
      },
    ] as never);

    const result = await getReactionsForPost(mockPostId as never);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('HUGS');
    expect(result[0].count).toBe(1);
  });
});
```

**Step 2: Run to confirm tests fail**

```bash
nx run mockingbird:test --testPathPattern="reactionService" --skip-nx-cache
```

Expected: FAIL — `reactionService` module not found.

**Step 3: Implement `reactionService.ts`**

Create `apps/mockingbird/src/_server/reactionService.ts`:

```ts
import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { PostReactionSummary, PostId, ReactionType, UserId } from '@/_types';
import { errorToString } from '@/_utils/errorToString';

const logger = baseLogger.child({ service: 'reactions:service' });

type RawReactionRow = {
  userId: string;
  reaction: string;
  user: { id: string; name: string; image: string | null };
};

export function groupPostReactions(
  raw: RawReactionRow[]
): PostReactionSummary[] {
  const map = new Map<string, PostReactionSummary>();

  for (const row of raw) {
    const existing = map.get(row.reaction);
    const user = { id: row.userId as UserId, name: row.user.name, image: row.user.image };

    if (existing) {
      existing.count += 1;
      existing.users.push(user);
    } else {
      map.set(row.reaction, {
        type: row.reaction as ReactionType,
        count: 1,
        users: [user],
      });
    }
  }

  return Array.from(map.values());
}

export async function setReaction(
  postId: PostId,
  userId: UserId,
  reaction: ReactionType
): Promise<void> {
  try {
    await prisma.postReaction.upsert({
      where: { postId_userId: { postId, userId } },
      update: { reaction },
      create: { postId, userId, reaction },
    });
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`setReaction: ${errorToString(error)}`);
  }
}

export async function removeReaction(
  postId: PostId,
  userId: UserId
): Promise<void> {
  try {
    await prisma.postReaction.delete({
      where: { postId_userId: { postId, userId } },
    });
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`removeReaction: ${errorToString(error)}`);
  }
}

export async function getReactionsForPost(
  postId: PostId
): Promise<PostReactionSummary[]> {
  try {
    const rows = await prisma.postReaction.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
    return groupPostReactions(rows);
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`getReactionsForPost: ${errorToString(error)}`);
  }
}
```

**Step 4: Run tests to confirm they pass**

```bash
nx run mockingbird:test --testPathPattern="reactionService" --skip-nx-cache
```

Expected: PASS — all tests pass.

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/reactionService.ts apps/mockingbird/src/_server/__tests__/reactionService.spec.ts
git commit -m "feat: add server-side reactionService with groupPostReactions helper"
```

---

## Task 5: Update postsService to include reactions in post/comment fetches

**Files:**
- Modify: `apps/mockingbird/src/_server/postsService.ts`

The `getPostWithId` and `getCommentsForPost` functions need to include reaction data.

**Step 1: Update imports in `postsService.ts`**

Add to imports:
```ts
import { groupPostReactions } from '@/_server/reactionService';
```

**Step 2: Update `getPostWithId`**

Replace the function body:
```ts
export async function getPostWithId(postId: PostId) {
  try {
    const rawData = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        reactions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!rawData) {
      return undefined;
    }

    const { reactions: rawReactions, ...postData } = rawData;
    const post = PostSchema.parse({
      ...postData,
      reactions: groupPostReactions(rawReactions),
    });
    return post;
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`getPostWithId: ${errorToString(error)}`);
  }
}
```

**Step 3: Update `getCommentsForPost`**

Replace the function body:
```ts
export async function getCommentsForPost(postId: PostId, limit?: number) {
  try {
    const rawData = await prisma.post.findMany({
      where: { responseToPostId: postId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        reactions: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    const comments = rawData.map((raw) => {
      const { reactions: rawReactions, ...postData } = raw;
      return PostSchema.parse({
        ...postData,
        reactions: groupPostReactions(rawReactions),
      });
    });
    return comments;
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`getCommentsForPost: ${errorToString(error)}`);
  }
}
```

**Step 4: Run existing tests to confirm nothing broke**

```bash
nx run mockingbird:test --testPathPattern="postsService" --skip-nx-cache
```

Expected: PASS — all 3 existing tests pass (they mock `prisma.post.create`, not `findUnique`, so unaffected).

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/postsService.ts
git commit -m "feat: include reactions in getPostWithId and getCommentsForPost"
```

---

## Task 6: Update feedService to include reactions in feed posts

**Files:**
- Modify: `apps/mockingbird/src/_server/feedService.ts`

**Step 1: Update imports**

Add to imports:
```ts
import { groupPostReactions } from '@/_server/reactionService';
```

**Step 2: Add a helper to parse posts with reactions**

Add this helper at the top of the file (after imports):
```ts
function parsePostsWithReactions(
  rawData: Array<{ reactions?: Array<{ userId: string; reaction: string; user: { id: string; name: string; image: string | null } }>; [key: string]: unknown }>
) {
  return rawData.map((raw) => {
    const { reactions: rawReactions = [], ...postData } = raw;
    return PostSchema.parse({
      ...postData,
      reactions: groupPostReactions(rawReactions),
    });
  });
}
```

**Step 3: Update `getPrivateFeedForUser`**

Replace the `prisma.post.findMany` call to include reactions:
```ts
const rawData = await prisma.post.findMany({
  where: {
    posterId: { in: userIdsForFeed as unknown as string[] },
    responseToPostId: null,
  },
  orderBy: { createdAt: 'desc' },
  include: {
    reactions: {
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    },
  },
});

const posts = parsePostsWithReactions(rawData);
return posts;
```

**Step 4: Update `getPublicFeed`**

Replace the `prisma.post.findMany` call:
```ts
const rawData = await prisma.post.findMany({
  where: {
    audience: 'PUBLIC',
    responseToPostId: null,
  },
  orderBy: { createdAt: 'desc' },
  take: PUBLIC_FEED_PAGE_SIZE,
  ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  include: {
    reactions: {
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    },
  },
});

const posts = parsePostsWithReactions(rawData);
return posts;
```

**Step 5: Commit**

```bash
git add apps/mockingbird/src/_server/feedService.ts
git commit -m "feat: include reactions in feed posts"
```

---

## Task 7: Add API routes — PUT and DELETE /api/posts/[postId]/reactions

**Files:**
- Create: `apps/mockingbird/src/app/api/posts/[postId]/reactions/route.ts`

**Step 1: Create the route file**

```ts
// apps/mockingbird/src/app/api/posts/[postId]/reactions/route.ts
import baseLogger from '@/_server/logger';
import { removeReaction, setReaction } from '@/_server/reactionService';
import { getReactionsForPost } from '@/_server/reactionService';
import { doesPostExist } from '@/_server/postsService';
import { PostIdSchema, SetReactionSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { Prisma } from '../../../../../prisma/generated/client.js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createErrorResponse, respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

const logger = baseLogger.child({ service: 'api:posts:reactions' });

const ParamsSchema = z.object({
  postId: PostIdSchema,
});

// PUT /api/posts/[postId]/reactions
// Body: { reaction: ReactionType }
// Sets or replaces the current user's reaction on a post.
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();
    const { postId } = ParamsSchema.parse(await context.params);

    const postExists = await doesPostExist(postId);
    if (!postExists) {
      throw new ResponseError(404, `Post not found: ${postId}`);
    }

    const body = await req.json();
    const { reaction } = SetReactionSchema.parse(body);

    await setReaction(postId, session.user.id, reaction);

    const reactions = await getReactionsForPost(postId);
    return NextResponse.json(reactions, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

// DELETE /api/posts/[postId]/reactions
// Removes the current user's reaction from a post.
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();
    const { postId } = ParamsSchema.parse(await context.params);

    await removeReaction(postId, session.user.id);

    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return createErrorResponse(404, 'Reaction not found');
    }
    logger.error(error);
    return respondWithError(error);
  }
}
```

**Step 2: Verify the app builds without TS errors**

```bash
nx run mockingbird:build 2>&1 | head -60
```

Expected: No TypeScript errors in the new route file.

**Step 3: Commit**

```bash
git add apps/mockingbird/src/app/api/posts/[postId]/reactions/
git commit -m "feat: add PUT and DELETE /api/posts/[postId]/reactions endpoints"
```

---

## Task 8: Add client-side API service for reactions

**Files:**
- Create: `apps/mockingbird/src/_apiServices/reactionService.ts`

**Step 1: Create the service**

```ts
// apps/mockingbird/src/_apiServices/reactionService.ts
'use client';
import {
  PostId,
  PostReactionSummary,
  PostReactionSummarySchema,
  ReactionType,
} from '@/_types';
import { z } from 'zod';
import { fetchFromServer } from './fetchFromServer';

export async function setReaction(
  postId: PostId,
  reaction: ReactionType
): Promise<PostReactionSummary[]> {
  const response = await fetchFromServer(`/posts/${postId}/reactions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reaction }),
  });
  const rawData = await response.json();
  return z.array(PostReactionSummarySchema).parse(rawData);
}

export async function removeReaction(postId: PostId): Promise<void> {
  await fetchFromServer(`/posts/${postId}/reactions`, {
    method: 'DELETE',
  });
}
```

**Step 2: Commit**

```bash
git add apps/mockingbird/src/_apiServices/reactionService.ts
git commit -m "feat: add client-side reactionService API wrapper"
```

---

## Task 9: Add reactionUtils — emoji map and display helpers

**Files:**
- Create: `apps/mockingbird/src/_utils/reactionUtils.ts`

**Step 1: Create the utility**

```ts
// apps/mockingbird/src/_utils/reactionUtils.ts
import { ReactionType } from '@/_types';

export const REACTION_EMOJI: Record<ReactionType, string> = {
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  CHEER: '🎉',
  ANGER: '😠',
  LAUGH: '😂',
  HUGS: '🤗',
};

export const REACTION_LABEL: Record<ReactionType, string> = {
  THUMBS_UP: 'Like',
  THUMBS_DOWN: 'Dislike',
  CHEER: 'Cheer',
  ANGER: 'Angry',
  LAUGH: 'Haha',
  HUGS: 'Hugs',
};

export const ALL_REACTION_TYPES: ReactionType[] = [
  'THUMBS_UP',
  'THUMBS_DOWN',
  'CHEER',
  'ANGER',
  'LAUGH',
  'HUGS',
];
```

**Step 2: Commit**

```bash
git add apps/mockingbird/src/_utils/reactionUtils.ts
git commit -m "feat: add reactionUtils with emoji and label maps"
```

---

## Task 10: Build ReactionsBar client component

**Files:**
- Create: `apps/mockingbird/src/_components/ReactionsBar.client.tsx`

**Step 1: Create the component**

```tsx
// apps/mockingbird/src/_components/ReactionsBar.client.tsx
'use client';
import {
  removeReaction,
  setReaction,
} from '@/_apiServices/reactionService';
import { PostId, PostReactionSummary, ReactionType, UserId } from '@/_types';
import {
  ALL_REACTION_TYPES,
  REACTION_EMOJI,
  REACTION_LABEL,
} from '@/_utils/reactionUtils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  postId: PostId;
  initialReactions: PostReactionSummary[];
  currentUserId: UserId | undefined;
};

export function ReactionsBar({
  postId,
  initialReactions,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [reactions, setReactions] =
    useState<PostReactionSummary[]>(initialReactions);

  function getUserReaction(): ReactionType | undefined {
    if (!currentUserId) return undefined;
    return reactions.find((r) => r.users.some((u) => u.id === currentUserId))
      ?.type;
  }

  function getCount(type: ReactionType): number {
    return reactions.find((r) => r.type === type)?.count ?? 0;
  }

  function getUsers(type: ReactionType): PostReactionSummary['users'] {
    return reactions.find((r) => r.type === type)?.users ?? [];
  }

  async function handleReaction(type: ReactionType) {
    if (!currentUserId) return;

    const currentReaction = getUserReaction();

    // Optimistic update
    setReactions((prev) => applyOptimisticReaction(prev, currentUserId, currentReaction, type));

    try {
      if (currentReaction === type) {
        await removeReaction(postId);
      } else {
        await setReaction(postId, type);
      }
      router.refresh();
    } catch {
      // Revert on error
      setReactions(initialReactions);
    }
  }

  const userReaction = getUserReaction();

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {ALL_REACTION_TYPES.map((type) => {
        const count = getCount(type);
        const isActive = userReaction === type;
        const users = getUsers(type);

        return (
          <div key={type} className="tooltip" data-tip={formatReactorNames(users)}>
            <button
              onClick={() => handleReaction(type)}
              disabled={!currentUserId}
              aria-label={REACTION_LABEL[type]}
              className={`btn btn-xs gap-1 ${
                isActive
                  ? 'btn-primary'
                  : 'btn-ghost text-base-content/50 hover:text-base-content'
              }`}
            >
              <span>{REACTION_EMOJI[type]}</span>
              {count > 0 && <span className="text-xs">{count}</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatReactorNames(users: PostReactionSummary['users']): string {
  if (users.length === 0) return '';
  if (users.length <= 3) return users.map((u) => u.name).join(', ');
  return `${users.slice(0, 3).map((u) => u.name).join(', ')} +${users.length - 3} more`;
}

function applyOptimisticReaction(
  current: PostReactionSummary[],
  userId: UserId,
  previousType: ReactionType | undefined,
  newType: ReactionType
): PostReactionSummary[] {
  // Remove user from previous reaction if any
  let updated = current
    .map((r) => {
      if (r.type !== previousType) return r;
      const users = r.users.filter((u) => u.id !== userId);
      return { ...r, count: users.length, users };
    })
    .filter((r) => r.count > 0);

  if (previousType === newType) {
    // Toggle off — already removed above
    return updated;
  }

  // Add user to new reaction
  const existing = updated.find((r) => r.type === newType);
  const userEntry = { id: userId, name: '...', image: null };

  if (existing) {
    updated = updated.map((r) =>
      r.type === newType
        ? { ...r, count: r.count + 1, users: [...r.users, userEntry] }
        : r
    );
  } else {
    updated = [...updated, { type: newType, count: 1, users: [userEntry] }];
  }

  return updated;
}
```

**Step 2: Commit**

```bash
git add apps/mockingbird/src/_components/ReactionsBar.client.tsx
git commit -m "feat: add ReactionsBar client component with optimistic UI"
```

---

## Task 11: Update PostActionsFooter and SummaryPost

**Files:**
- Modify: `apps/mockingbird/src/_components/PostActionsFooter.tsx`
- Modify: `apps/mockingbird/src/_components/SummaryPost.tsx`

**Step 1: Update `PostActionsFooter.tsx`**

Replace the entire file:

```tsx
// apps/mockingbird/src/_components/PostActionsFooter.tsx
import { Post, UserId } from '@/_types';
import { CommentButton } from './CommentButton.client';
import { ReactionsBar } from './ReactionsBar.client';

interface Props {
  post: Post;
  numberOfComments?: number;
  currentUserId?: UserId;
}

export function PostActionsFooter({
  post,
  numberOfComments = 0,
  currentUserId,
}: Props) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2 border-t border-base-200">
      <ReactionsBar
        postId={post.id}
        initialReactions={post.reactions ?? []}
        currentUserId={currentUserId}
      />
      <div className="flex items-center gap-4">
        <CommentButton post={post} numberOfComments={numberOfComments} />
      </div>
    </div>
  );
}
```

**Step 2: Update `SummaryPost.tsx` to pass currentUserId**

Locate the `PostActionsFooter` usage in `SummaryPost.tsx` (line 82):
```tsx
<PostActionsFooter post={post} numberOfComments={numberOfComments} />
```

Replace with:
```tsx
<PostActionsFooter
  post={post}
  numberOfComments={numberOfComments}
  currentUserId={currentUserId}
/>
```

The `currentUserId` variable is already computed earlier in `SummaryPost.tsx`:
```ts
const { data: currentUserId } = UserIdSchema.safeParse(session?.user?.id);
```

**Step 3: Start dev server and manually verify the UI**

```bash
nx run mockingbird:dev
```

- Navigate to the feed
- Confirm the reactions bar appears below posts with 6 emoji buttons
- Click a reaction — it should highlight and show count 1
- Click same reaction again — it should toggle off
- Click a different reaction — it should switch (old unhighlights, new highlights)
- Hover a reaction with count > 0 — tooltip should show reactor names

**Step 4: Commit**

```bash
git add apps/mockingbird/src/_components/PostActionsFooter.tsx apps/mockingbird/src/_components/SummaryPost.tsx
git commit -m "feat: wire ReactionsBar into PostActionsFooter"
```

---

## Task 12: Run full test suite and update reference docs

**Files:**
- Modify: `apps/mockingbird/.claude/reference/data-model.md`
- Modify: `apps/mockingbird/.claude/reference/api-contracts.md`
- Modify: `apps/mockingbird/.claude/reference/features-api.md`
- Modify: `apps/mockingbird/.claude/reference/features-web-app.md`

**Step 1: Run all tests**

```bash
nx run-many -t test --skip-nx-cache
```

Expected: All tests pass.

**Step 2: Update `data-model.md`**

- In the `Post` table: remove the `likeCount` and `dislikeCount` rows; add `reactions PostReaction[]` relation note
- Add a new `PostReaction` section documenting the model
- Update the cascade behavior table: "Delete Post → ... + all PostReaction rows for that post"
- Update the cascade behavior table: "Delete User → ... + PostReaction rows for that user"

**Step 3: Update `api-contracts.md`**

- Add a new `### Reactions` section under `## Endpoints` documenting:
  - `PUT /api/posts/[postId]/reactions`
  - `DELETE /api/posts/[postId]/reactions`
- Update the `Post` response shape (remove `likeCount`/`dislikeCount`; add optional `reactions` field with its shape)

**Step 4: Update `features-api.md`**

- Change the "Like / dislike" stub row to: `Post reactions | Complete | PUT/DELETE /api/posts/[postId]/reactions | Six types; one per user; upsert replaces existing`
- Remove from "Unimplemented Stubs"

**Step 5: Update `features-web-app.md`**

- Add a reactions entry documenting the ReactionsBar component, where it appears, and the 6 reaction types.

**Step 6: Commit**

```bash
git add .claude/reference/
git commit -m "docs: update reference docs for post reactions feature"
```
