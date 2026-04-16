'use client';
import {
  removeReaction,
  setReaction,
} from '@/_apiServices/reactions';
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
