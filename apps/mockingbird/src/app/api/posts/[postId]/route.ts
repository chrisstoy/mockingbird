import baseLogger from '@/_server/logger';
import { deletePost, getPostWithId } from '@/_server/postsService';
import { PostIdSchema } from '@/_types/post';
import { RouteContext } from '@/app/types';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  respondWithError,
  ResponseError,
} from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:posts:post',
});

const ParamsSchema = z.object({
  postId: PostIdSchema,
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await validateAuthentication();

    const { postId } = ParamsSchema.parse(await context.params);

    const post = await getPostWithId(postId);

    if (!post) {
      throw new ResponseError(404, `Post not found: ${postId}`);
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await validateAuthentication();

    const { postId } = ParamsSchema.parse(await context.params);

    const wasDeleted = await deletePost(postId);
    if (!wasDeleted) {
      throw new ResponseError(404, `Post not found: ${postId}`);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return createErrorResponse(404, `Post does not exist`);
    }

    logger.error(error);
    return respondWithError(error);
  }
}
