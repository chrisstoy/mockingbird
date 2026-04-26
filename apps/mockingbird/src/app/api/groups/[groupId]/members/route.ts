import {
  addGroupMember,
  appendGroupAuditLog,
  getGroupById,
  getGroupMemberRole,
  getGroupMembers,
} from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
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
    if (!role) throw new ResponseError(403, 'Not a member');
    const members = await getGroupMembers(gid);
    return NextResponse.json(members);
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
    if (group.visibility !== 'PUBLIC') throw new ResponseError(403, 'Group is private');
    if (group.status === 'DISABLED') throw new ResponseError(403, 'Group is disabled');

    const existing = await getGroupMemberRole(gid, userId);
    if (existing) throw new ResponseError(409, 'Already a member');

    const member = await addGroupMember(gid, userId, 'MEMBER');
    await appendGroupAuditLog(gid, userId, 'member.joined', userId);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return respondWithError(error);
  }
}
