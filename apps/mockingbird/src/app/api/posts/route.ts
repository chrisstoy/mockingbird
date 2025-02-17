import baseLogger from '@/_server/logger';
import { createPost } from '@/_server/postsService';
import { CreatePostDataSchema } from '@/_types/post';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:posts',
});

const NewPostFormDataSchema = CreatePostDataSchema.extend({
  image: z.instanceof(File).optional(),
});

/**
 * Create a new Post
 * @param req
 * @returns
 */
export async function POST(req: NextRequest) {
  try {
    const session = await validateAuthentication();

    const body = await req.json();
    const { posterId, content } = NewPostFormDataSchema.parse(body);

    if (session.user?.id !== posterId) {
      throw new ResponseError(
        400,
        `posterId ${posterId} does not match the logged in userId ${session.user?.id}`
      );
    }

    const post = await createPost(posterId, content);

    logger.info(
      `Created a new post with id ${post.id} for userId: ${posterId}`
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
