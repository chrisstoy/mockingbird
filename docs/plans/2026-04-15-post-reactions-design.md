# Post Reactions Design

**Date:** 2026-04-15
**Branch:** MOC-7-Application-supports-user-reacting-to-a-Post

## Overview

Users can react to any post, comment, or reply with one of six emoji reactions. Each user may have at most one reaction per post (auto-replaced when changed, toggle-off supported). Reaction counts and reactor names are visible to all users.

---

## Requirements

- Reactions apply to all post types: top-level posts, comments, and replies
- One reaction per user per post; picking a different reaction auto-replaces the old one
- Clicking the same active reaction removes it (toggle off)
- Users can see who reacted with each type (names list)
- Remove stub `likeCount` / `dislikeCount` fields from `Post` model

### Reaction Types

| Enum Value  | Emoji |
|-------------|-------|
| `THUMBS_UP` | 👍    |
| `THUMBS_DOWN` | 👎  |
| `CHEER`     | 🎉    |
| `ANGER`     | 😠    |
| `LAUGH`     | 😂    |
| `HUGS`      | 🤗    |

---

## Database

### Schema Changes

Remove from `Post` model:
- `likeCount Int @default(0)`
- `dislikeCount Int @default(0)`

Add to `schema.prisma`:

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

Add relations:
- `Post` → `reactions PostReaction[]`
- `User` → `reactions PostReaction[]`

### Cascade Behavior

- Delete Post → all `PostReaction` rows for that post deleted automatically
- Delete User → all `PostReaction` rows for that user deleted automatically

---

## API

### New Endpoints

#### `PUT /api/posts/[postId]/reactions`
- **Auth:** `validateAuthentication()`
- **Body:** `{ reaction: ReactionType }`
- **Behavior:** Upsert on `@@id([postId, userId])` (composite primary key) — creates or replaces the user's existing reaction
- **Response 200:** Updated reactions summary for the post

#### `DELETE /api/posts/[postId]/reactions`
- **Auth:** `validateAuthentication()`
- **Body:** none
- **Behavior:** Deletes the `PostReaction` row for the current user on this post
- **Response 204:** No content
- **Response 404:** If no reaction existed

### Updated Endpoints

**`GET /api/posts/[postId]`** and **feed endpoints** — `Post` response now includes:

```ts
reactions: {
  type: ReactionType;
  count: number;
  users: { id: UserId; name: string; image: string | null }[];
}[]
```

Computed in `postService` by grouping `PostReaction` rows by type and joining user info.

---

## Types

- Add `ReactionType` enum to `@/_types`
- Add `PostReactionId` branded type to `@/_types`
- Update `Post` type to include `reactions` field and remove `likeCount`/`dislikeCount`
- New `PostReactionSummary` type:
  ```ts
  type PostReactionSummary = {
    type: ReactionType;
    count: number;
    users: { id: UserId; name: string; image: string | null }[];
  };
  ```

---

## UI

### New Components

**`src/_components/ReactionsBar.client.tsx`**
- Row of 6 reaction buttons
- Each button: emoji + count (hidden if 0)
- Active/highlighted state for the current user's reaction
- Click active reaction → `DELETE` (toggle off)
- Click inactive reaction → `PUT` (set or replace)
- Optimistic UI: update local state immediately, revert on error
- Users with count > 0: show DaisyUI tooltip listing reactor names

**`src/_utils/reactionUtils.ts`**
```ts
const REACTION_EMOJI: Record<ReactionType, string> = {
  THUMBS_UP: '👍',
  THUMBS_DOWN: '👎',
  CHEER: '🎉',
  ANGER: '😠',
  LAUGH: '😂',
  HUGS: '🤗',
};
```

**`src/_apiServices/reactionService.ts`**
- `setReaction(postId: PostId, reaction: ReactionType): Promise<PostReactionSummary[]>`
- `removeReaction(postId: PostId): Promise<void>`
- Both wrap `fetchFromServer`

### Updated Components

**`PostActionsFooter.tsx`** — Add `ReactionsBar` above the comment button. Pass `post.reactions` and `currentUserId`.

---

## Reference Docs to Update

After implementation, update:
- `.claude/reference/data-model.md` — remove likeCount/dislikeCount, add PostReaction table
- `.claude/reference/api-contracts.md` — add reactions endpoints, update Post response shape
- `.claude/reference/features-api.md` — add reactions feature
- `.claude/reference/features-web-app.md` — add reactions UI feature
