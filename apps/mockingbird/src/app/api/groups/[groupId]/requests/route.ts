import {
  appendGroupAuditLog,
  createGroupJoinRequest,
  getGroupById,
  getGroupMemberRole,
  getPendingJoinRequests,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserId, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);
    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');
    const requests = await getPendingJoinRequests(gid);
    return NextResponse.json(requests);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');
    if (group.visibility !== 'PRIVATE')
      throw new ResponseError(400, 'Group is public — join directly');
    if (group.status === 'DISABLED') throw new ResponseError(403, 'Group is disabled');

    const existing = await getGroupMemberRole(gid, userId);
    if (existing) throw new ResponseError(409, 'Already a member');

    const request = await createGroupJoinRequest(gid, userId);
    await appendGroupAuditLog(gid, userId, 'request.sent', request.id);

    await createNotification({
      userId: group.ownerId as UserId,
      type: NotificationType.GROUP_JOIN_REQUEST,
      actorId: userId,
      entityId: request.id,
      metadata: { groupId: gid },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
