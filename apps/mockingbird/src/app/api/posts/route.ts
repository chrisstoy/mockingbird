import baseLogger from '@/_server/logger';
import { CreatePostDataSchema } from '@/_types/post';
import { auth } from '@/app/auth';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';
import { createPost } from './service';

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
        'posterId does not match the logged in user'
      );
    }

    const post = await createPost(posterId, content);

    revalidateTag('feed');

    logger.info(
      `Created a new post with id ${post.id} for userId: ${posterId}`
    );

    return NextResponse.json({ postId: post.id }, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
