import baseLogger from '@/_server/logger';
import { createPost } from '@/_server/postsService';
import { CreatePostDataSchema } from '@/_types/post';
import { auth } from '@/app/auth';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:posts',
});

export const POST = auth(async function POST(request) {
  try {
    validateAuthentication(request.auth);

    const body = await request.json();
    const { posterId, content } = CreatePostDataSchema.parse(body);

    if (request.auth?.user?.id !== posterId) {
      throw new ResponseError(
        400,
        `posterId ${posterId} does not match the logged in userId ${request.auth?.user?.id}`
      );
    }

    const post = await createPost(posterId, content);

    revalidateTag('feed');

    logger.info(
      `Created a new post with id ${post.id} for userId: ${posterId}`
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
