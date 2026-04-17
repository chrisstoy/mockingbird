import { validateAndConsumeEmailVerificationToken } from '@/_server/usersService';
import { prisma } from '@/_server/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=invalid', request.nextUrl)
    );
  }

  let userId: string;
  try {
    userId = await validateAndConsumeEmailVerificationToken(token);
  } catch {
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=invalid', request.nextUrl)
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date(), status: 'ACTIVE' },
    select: { email: true },
  });

  const welcomeUrl = new URL('/auth/welcome', request.nextUrl);
  if (updatedUser.email) {
    welcomeUrl.searchParams.set('email', updatedUser.email);
  }

  return NextResponse.redirect(welcomeUrl);
}
