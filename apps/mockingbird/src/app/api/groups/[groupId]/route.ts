import {
  appendGroupAuditLog,
  deleteGroup,
  getGroupById,
  getGroupMemberRole,
  updateGroup,
} from '@/_server/groupService';
import { GroupIdSchema, UpdateGroupSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await validateAuthentication();
    const { groupId } = await params;
    const group = await getGroupById(GroupIdSchema.parse(groupId));
    if (!group) throw new ResponseError(404, 'Group not found');
    return NextResponse.json(group);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const body = UpdateGroupSchema.parse(await req.json());

    if (body.status !== undefined && role !== 'OWNER') {
      throw new ResponseError(403, 'Only the owner can change group status');
    }

    const updated = await updateGroup(gid, body);

    if (body.name && body.name !== group.name)
      await appendGroupAuditLog(gid, userId, 'group.name_changed');
    if (body.description !== undefined && body.description !== group.description)
      await appendGroupAuditLog(gid, userId, 'group.description_changed');
    if (body.avatarUrl !== undefined && body.avatarUrl !== group.avatarUrl)
      await appendGroupAuditLog(gid, userId, 'group.avatar_changed');
    if (body.visibility && body.visibility !== group.visibility)
      await appendGroupAuditLog(gid, userId, 'group.visibility_changed');
    if (body.status && body.status !== group.status)
      await appendGroupAuditLog(gid, userId, 'group.status_changed');

    return NextResponse.json(updated);
  } catch (error) {
    return respondWithError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const group = await getGroupById(gid);
    if (!group) throw new ResponseError(404, 'Group not found');

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'OWNER') throw new ResponseError(403, 'Only the owner can delete a group');

    await appendGroupAuditLog(gid, userId, 'group.deleted');
    await deleteGroup(gid);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
