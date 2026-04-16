import baseLogger from '@/_server/logger';
import { removeReaction, setReaction, getReactionsForPost } from '@/_server/reactionService';
import { doesPostExist } from '@/_server/postsService';
import { PostIdSchema, SetReactionSchema } from '@/_types';
import { RouteContext } from '@/app/types';
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
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return createErrorResponse(404, 'Reaction not found');
    }
    logger.error(error);
    return respondWithError(error);
  }
}
