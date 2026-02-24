import { logAdminAction } from '@/_server/adminService';
import { deletePost } from '@/_server/postsService';
import { PostIdSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { respondWithError } from '../../../errors';
import { validatePermission } from '../../../validateAuthentication';

const ParamsSchema = z.object({ postId: PostIdSchema });

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await validatePermission('posts:delete');
    const { postId } = ParamsSchema.parse(await context.params);
    await deletePost(postId);
    await logAdminAction(session.user.id, 'DELETE_POST', postId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
