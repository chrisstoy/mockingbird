import {
  appendGroupAuditLog,
  getGroupMemberRole,
  transferGroupOwnership,
} from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const ownerId = UserIdSchema.parse(session.user?.id);

    const role = await getGroupMemberRole(gid, ownerId);
    if (role !== 'OWNER') throw new ResponseError(403, 'Only the owner can transfer ownership');

    const { newOwnerId } = z.object({ newOwnerId: UserIdSchema }).parse(await req.json());

    const newOwnerRole = await getGroupMemberRole(gid, newOwnerId);
    if (!newOwnerRole) throw new ResponseError(400, 'New owner must be an existing member');

    await transferGroupOwnership(gid, ownerId, newOwnerId);
    await appendGroupAuditLog(gid, ownerId, 'group.ownership_transferred', newOwnerId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respondWithError(error);
  }
}
