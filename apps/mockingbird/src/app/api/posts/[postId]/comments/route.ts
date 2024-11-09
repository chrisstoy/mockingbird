import baseLogger from '@/_server/logger';
import { createCommentDataSchema } from '@/_types/post';
import { ResponseError } from '@/app/api/types';
import { respondWithError } from '@/app/api/users/service';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { auth } from '@/app/auth';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPost, doesPostExist, getCommentsForPost } from '../../service';

const logger = baseLogger.child({
  service: 'api:posts:post:comments',
});

const paramsSchema = z.object({
  postId: z.string().min(1),
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

/**
 * Create a Comment on a Post
 */
export const POST = auth(async function POST(request, context) {
  try {
    validateAuthentication(request.auth);

    const { postId } = paramsSchema.parse(context.params);

    const body = await request.json();
    const { posterId, content } = createCommentDataSchema.parse(body);

    if (request.auth?.user?.id !== posterId) {
      throw new ResponseError(
        400,
        'posterId does not match the logged in user'
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
