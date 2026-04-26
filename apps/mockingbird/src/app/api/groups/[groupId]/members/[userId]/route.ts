import {
  appendGroupAuditLog,
  changeGroupMemberRole,
  getGroupMemberRole,
  removeGroupMember,
} from '@/_server/groupService';
import { GroupIdSchema, GroupRoleSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../../errors';
import { validateAuthentication } from '../../../../validateAuthentication';

type Params = { params: Promise<{ groupId: string; userId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, userId: targetUserId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);
    const targetId = UserIdSchema.parse(targetUserId);

    const actorRole = await getGroupMemberRole(gid, actorId);
    const isSelf = actorId === targetId;

    if (!isSelf && actorRole !== 'ADMIN' && actorRole !== 'OWNER') {
      throw new ResponseError(403, 'Forbidden');
    }

    await removeGroupMember(gid, targetId);
    await appendGroupAuditLog(gid, actorId, isSelf ? 'member.left' : 'member.removed', targetId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId, userId: targetUserId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const actorId = UserIdSchema.parse(session.user?.id);
    const targetId = UserIdSchema.parse(targetUserId);

    const actorRole = await getGroupMemberRole(gid, actorId);
    if (actorRole !== 'ADMIN' && actorRole !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const { role } = z.object({ role: GroupRoleSchema }).parse(await req.json());

    if ((role === 'OWNER' || role === 'ADMIN') && actorRole !== 'OWNER') {
      throw new ResponseError(403, 'Only the owner can assign Admin or Owner roles');
    }

    const member = await changeGroupMemberRole(gid, targetId, role);
    await appendGroupAuditLog(gid, actorId, 'member.role_changed', targetId, { role });

    return NextResponse.json(member);
  } catch (error) {
    return respondWithError(error);
  }
}
