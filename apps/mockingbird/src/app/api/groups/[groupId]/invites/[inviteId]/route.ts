import {
  addGroupMember,
  appendGroupAuditLog,
  getGroupInvite,
  updateGroupInviteStatus,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserId, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../../errors';
import { validateAuthentication } from '../../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string; inviteId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, inviteId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const invite = await getGroupInvite(inviteId);
    if (!invite || invite.groupId !== gid) throw new ResponseError(404, 'Invite not found');
    if (invite.invitedUserId !== userId) throw new ResponseError(403, 'Forbidden');
    if (invite.status !== 'PENDING') throw new ResponseError(409, 'Invite already resolved');

    const { status } = z
      .object({ status: z.enum(['ACCEPTED', 'DECLINED']) })
      .parse(await req.json());

    await updateGroupInviteStatus(inviteId, status);
    await appendGroupAuditLog(
      gid,
      userId,
      status === 'ACCEPTED' ? 'invite.accepted' : 'invite.declined',
      inviteId
    );

    if (status === 'ACCEPTED') {
      await addGroupMember(gid, userId, 'MEMBER');
      await appendGroupAuditLog(gid, userId, 'member.joined', userId);
      await createNotification({
        userId: invite.invitedByUserId as UserId,
        type: NotificationType.GROUP_INVITE_ACCEPTED,
        actorId: userId,
        entityId: inviteId,
        metadata: { groupId: gid },
      });
    } else {
      await createNotification({
        userId: invite.invitedByUserId as UserId,
        type: NotificationType.GROUP_INVITE_DECLINED,
        actorId: userId,
        entityId: inviteId,
        metadata: { groupId: gid },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
