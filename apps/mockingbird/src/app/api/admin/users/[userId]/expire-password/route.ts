import { logAdminAction } from '@/_server/adminService';
import { expireUserPassword } from '@/_server/usersService';
import { UserId, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { validatePermission } from '../../../../validateAuthentication';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await validatePermission('users:edit');
  const { userId: userIdRaw } = await params;
  const userId = UserIdSchema.parse(userIdRaw) as UserId;

  await expireUserPassword(userId);
  await logAdminAction(session.user.id, 'EXPIRE_PASSWORD', userId);

  return NextResponse.json({}, { status: 200 });
}
