import baseLogger from '@/_server/logger';
import { createPost } from '@/_server/postsService';
import { CreatePostDataSchema } from '@/_types/post';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:posts',
});

export async function POST(req: NextRequest) {
  try {
    const session = await validateAuthentication();

    const body = await req.json();
    const { posterId, content } = CreatePostDataSchema.parse(body);

    if (session.user?.id !== posterId) {
      throw new ResponseError(
        400,
        `posterId ${posterId} does not match the logged in userId ${session.user?.id}`
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
}
