import {
  addGroupMember,
  appendGroupAuditLog,
  getGroupJoinRequest,
  getGroupMemberRole,
  updateGroupJoinRequestStatus,
} from '@/_server/groupService';
import { createNotification } from '@/_server/notificationService';
import { GroupIdSchema, NotificationType, UserId, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../../errors';
import { validateAuthentication } from '../../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string; requestId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, requestId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);

    const actorRole = await getGroupMemberRole(gid, actorId);
    if (actorRole !== 'ADMIN' && actorRole !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const request = await getGroupJoinRequest(requestId);
    if (!request || request.groupId !== gid) throw new ResponseError(404, 'Request not found');
    if (request.status !== 'PENDING') throw new ResponseError(409, 'Request already resolved');

    const { status } = z
      .object({ status: z.enum(['ACCEPTED', 'DECLINED']) })
      .parse(await req.json());

    await updateGroupJoinRequestStatus(requestId, status);
    await appendGroupAuditLog(
      gid,
      actorId,
      status === 'ACCEPTED' ? 'request.accepted' : 'request.declined',
      requestId
    );

    if (status === 'ACCEPTED') {
      await addGroupMember(gid, request.userId as UserId, 'MEMBER');
      await appendGroupAuditLog(gid, actorId, 'member.joined', request.userId);
    }

    await createNotification({
      userId: request.userId as UserId,
      type:
        status === 'ACCEPTED'
          ? NotificationType.GROUP_JOIN_REQUEST_ACCEPTED
          : NotificationType.GROUP_JOIN_REQUEST_DECLINED,
      actorId,
      entityId: requestId,
      metadata: { groupId: gid },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
