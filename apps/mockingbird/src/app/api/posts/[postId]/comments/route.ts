import baseLogger from '@/_server/logger';
import {
  createPost,
  getCommentsForPost,
  getPostWithId,
} from '@/_server/postsService';
import { ImageIdSchema, PostIdSchema, UserIdSchema } from '@/_types';
import { respondWithError, ResponseError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
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

    const { postId } = ParamsSchema.parse(await context.params);
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

const CreateCommentDataSchema = z
  .object({
    posterId: UserIdSchema,
    content: z.string().min(1, 'Must provide content'),
    imageId: ImageIdSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.imageId && !val.content?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must provide content and/or imageId',
      });
    }
  });

/**
 * Create a Comment on a Post
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { postId } = ParamsSchema.parse(await context.params);

    const body = await req.json();
    const { posterId, content, imageId } = CreateCommentDataSchema.parse(body);

    if (session.user?.id !== posterId) {
      throw new ResponseError(
        400,
        `posterId ${posterId} does not match the logged in userId ${session.user?.id}`
      );
    }

    const originalPost = await getPostWithId(postId);
    if (!originalPost) {
      throw new ResponseError(
        400,
        `Post being commented on does not exist: ${postId}`
      );
    }

    const post = await createPost(
      posterId,
      originalPost.audience,
      content,
      postId,
      imageId
    );

    logger.info(
      `Commented on a Post: {${{
        commentId: post.id,
        posterId: post.posterId,
        responseToPostId: post.responseToPostId,
      }}}`
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
