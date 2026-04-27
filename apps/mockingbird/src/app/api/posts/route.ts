import baseLogger from '@/_server/logger';
import { getGroupById, getGroupMemberRole } from '@/_server/groupService';
import { createPost } from '@/_server/postsService';
import { CreatePostDataSchema, GroupIdSchema, ImageIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:posts',
});

const NewPostFormDataSchema = CreatePostDataSchema.extend({
  imageId: ImageIdSchema.optional(),
  groupId: GroupIdSchema.optional(),
});

/**
 * Create a new Post
 */
export async function POST(req: NextRequest) {
  try {
    const session = await validateAuthentication();

    const body = await req.json();
    const { posterId, content, imageId, audience, groupId } =
      NewPostFormDataSchema.parse(body);

    if (session.user?.id !== posterId) {
      throw new ResponseError(
        403,
        `posterId ${posterId} does not match the logged in userId ${session.user?.id}`
      );
    }

    if (groupId) {
      const group = await getGroupById(groupId);
      if (!group) throw new ResponseError(404, 'Group not found');
      if (group.status === 'DISABLED') throw new ResponseError(403, 'Group is disabled');
      const role = await getGroupMemberRole(groupId, posterId);
      if (!role || role === 'LURKER') throw new ResponseError(403, 'Insufficient group permissions');
    }

    const post = await createPost(posterId, audience, content, null, imageId, groupId);

    logger.info(
      `Created a new post: {${{ postId: post.id, posterId: post.posterId }}}`
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
