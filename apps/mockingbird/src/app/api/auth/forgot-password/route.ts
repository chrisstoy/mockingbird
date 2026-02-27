import { sendPasswordResetEmail } from '@/_server/emailService';
import {
  createPasswordResetToken,
  getUserByEmail,
} from '@/_server/usersService';
import { env } from '@/../env';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await getUserByEmail(email);

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const origin = env.API_HOST ?? new URL(request.url).origin;
    const resetUrl = `${origin}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return NextResponse.json(
    { message: 'If that email exists, a reset link was sent.' },
    { status: 200 }
  );
}
