import baseLogger from '@/_server/logger';
import {
  createPost,
  doesPostExist,
  getCommentsForPost,
} from '@/_server/postsService';
import { PostIdSchema } from '@/_types/post';
import { UserIdSchema } from '@/_types/users';
import { respondWithError, ResponseError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:posts:post:comments',
});

const ParamsSchema = z.object({
  postId: PostIdSchema,
});

const QueryParamsSchema = z.object({
  limit: z.string().optional(),
});

/**
 * Get all Comments on a Post
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await validateAuthentication();

    const { postId } = ParamsSchema.parse(context.params);
    const queryParams = QueryParamsSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );
    const limit = queryParams.limit ? parseInt(queryParams.limit) : undefined;

    logger.info(
      `Getting comments for Post: { postId: ${postId}, limit: ${limit} }`
    );

    const feed = await getCommentsForPost(postId, limit);

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

const CreateCommentDataSchema = z.object({
  posterId: UserIdSchema,
  content: z.string().min(1),
});

/**
 * Create a Comment on a Post
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { postId } = ParamsSchema.parse(context.params);

    const body = await req.json();
    const { posterId, content } = CreateCommentDataSchema.parse(body);

    if (session.user?.id !== posterId) {
      throw new ResponseError(
        400,
        `posterId ${posterId} does not match the logged in userId ${session.user?.id}`
      );
    }

    const exists = await doesPostExist(postId);
    if (!exists) {
      throw new ResponseError(
        400,
        `Post being commented on does not exist: ${postId}`
      );
    }

    const post = await createPost(posterId, content, postId);

    revalidateTag('feed');

    logger.info(
      `Commented on a Post: {postId: ${post.id}, posterId: ${posterId}, content: ${content}, responseToPostId: ${postId}} `
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
