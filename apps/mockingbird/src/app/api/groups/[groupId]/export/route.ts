import { exportGroupPosts, getGroupById, getGroupMemberRole } from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const posts = await exportGroupPosts(gid);
    const archive = { group, exportedAt: new Date().toISOString(), posts };

    return new NextResponse(JSON.stringify(archive, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="flock-${gid}-export.json"`,
      },
    });
  } catch (error) {
    return respondWithError(error);
  }
}
