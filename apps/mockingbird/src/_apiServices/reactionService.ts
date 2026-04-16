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
