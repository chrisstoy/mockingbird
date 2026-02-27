import {
  getUserByEmail,
  updateUserPassword,
  verifyUserPassword,
} from '@/_server/usersService';
import { PasswordSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, currentPassword, newPassword } = body;

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Email, current password and new password are required' },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await verifyUserPassword(user.id, currentPassword);
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

  await updateUserPassword(user.id, newPassword);

  return NextResponse.json({ email: user.email }, { status: 200 });
}
