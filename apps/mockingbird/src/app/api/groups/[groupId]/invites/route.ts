import {
  appendGroupAuditLog,
  createGroupInvite,
  getGroupById,
  getGroupMemberRole,
  getPendingInvitesForGroup,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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
    const invites = await getPendingInvitesForGroup(gid);
    return NextResponse.json(invites);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);

    const role = await getGroupMemberRole(gid, actorId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const { invitedUserId } = z.object({ invitedUserId: UserIdSchema }).parse(await req.json());

    const invite = await createGroupInvite(gid, actorId, invitedUserId);
    await appendGroupAuditLog(gid, actorId, 'invite.sent', invite.id);
    await createNotification({
      userId: invitedUserId,
      type: NotificationType.GROUP_INVITE,
      actorId,
      entityId: invite.id,
      metadata: { groupId: gid },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
