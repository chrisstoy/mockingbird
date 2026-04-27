import { getGroupAuditLog, getGroupMemberRole } from '@/_server/groupService';
import { GroupIdSchema, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { respondWithError, ResponseError } from '../../../errors';
import { validateAuthentication } from '../../../validateAuthentication';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await validateAuthentication();
    const { groupId } = await params;
    const gid = GroupIdSchema.parse(groupId);
    const userId = UserIdSchema.parse(session.user?.id);

    const role = await getGroupMemberRole(gid, userId);
    if (role !== 'ADMIN' && role !== 'OWNER') throw new ResponseError(403, 'Forbidden');

    const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
    const log = await getGroupAuditLog(gid, cursor);
    return NextResponse.json(log);
  } catch (error) {
    return respondWithError(error);
  }
}
