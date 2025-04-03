import baseLogger from '@/_server/logger';
import { createPost } from '@/_server/postsService';
import { ImageIdSchema } from '@/_types/images';
import { CreatePostDataSchema } from '@/_types/post';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:posts',
});

const NewPostFormDataSchema = CreatePostDataSchema.extend({
  imageId: ImageIdSchema.optional(),
});

/**
 * Create a new Post
 */
export async function POST(req: NextRequest) {
  try {
    const session = await validateAuthentication();

    const body = await req.json();
    const { posterId, content, imageId } = NewPostFormDataSchema.parse(body);

    if (session.user?.id !== posterId) {
      throw new ResponseError(
        400,
        `posterId ${posterId} does not match the logged in userId ${session.user?.id}`
      );
    }

    const post = await createPost(posterId, content, null, imageId);

    logger.info(
      `Created a new post: {${{ postId: post.id, posterId: post.posterId }}}`
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
