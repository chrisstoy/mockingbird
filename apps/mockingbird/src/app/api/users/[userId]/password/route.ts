import {
  updateUserPassword,
  verifyUserPassword,
} from '@/_server/usersService';
import { PasswordSchema, UserId, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { validateAuthentication } from '../../../validateAuthentication';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await validateAuthentication();
  const { userId: userIdRaw } = await params;
  const userId = UserIdSchema.parse(userIdRaw) as UserId;

  if (session.user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Current password and new password are required' },
      { status: 400 }
    );
  }

  const valid = await verifyUserPassword(userId, currentPassword);
  if (!valid) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 401 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: 'New password must be different from current password' },
      { status: 400 }
    );
  }

  const passwordResult = PasswordSchema.safeParse(newPassword);
  if (!passwordResult.success) {
    return NextResponse.json(
      { error: passwordResult.error.errors[0]?.message ?? 'Invalid password' },
      { status: 400 }
    );
  }

  await updateUserPassword(userId, newPassword);

  return NextResponse.json({}, { status: 200 });
}
