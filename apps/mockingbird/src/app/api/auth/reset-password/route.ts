import {
  getUserById,
  updateUserPassword,
  validateAndConsumePasswordResetToken,
} from '@/_server/usersService';
import { PasswordSchema, UserId, UserIdSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, newPassword } = body;

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: 'Token and new password are required' },
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

  let userId: string;
  try {
    userId = await validateAndConsumePasswordResetToken(token);
  } catch {
    return NextResponse.json(
      { error: 'Link is invalid or expired' },
      { status: 400 }
    );
  }

  const user = await getUserById(UserIdSchema.parse(userId) as UserId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await updateUserPassword(UserIdSchema.parse(userId) as UserId, newPassword);

  return NextResponse.json({ email: user.email }, { status: 200 });
}
