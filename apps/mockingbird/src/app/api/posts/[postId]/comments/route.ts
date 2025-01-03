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
import { auth } from '@/app/auth';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:posts:post:comments',
});

const paramsSchema = z.object({
  postId: PostIdSchema,
});

/**
 * Get all Comments on a Post
 */
export const GET = auth(async function GET({ url: _url, auth }, context) {
  try {
    validateAuthentication(auth);

    const { postId } = paramsSchema.parse(context.params);
    const url = new URL(_url);
    const _limit = url.searchParams.get('limit');
    const limit = _limit ? parseInt(_limit) : undefined;

    logger.info(
      `Getting comments for Post: { postId: ${postId}, limit: ${limit} }`
    );

    const feed = await getCommentsForPost(postId, limit);

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});

const CreateCommentDataSchema = z.object({
  posterId: UserIdSchema,
  content: z.string().min(1),
});
/**
 * Create a Comment on a Post
 */
export const POST = auth(async function POST(request, context) {
  try {
    validateAuthentication(request.auth);

    const { postId } = paramsSchema.parse(context.params);

    const body = await request.json();
    const { posterId, content } = CreateCommentDataSchema.parse(body);

    if (request.auth?.user?.id !== posterId) {
      throw new ResponseError(
        400,
        `posterId ${posterId} does not match the logged in userId ${request.auth?.user?.id}`
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
});
