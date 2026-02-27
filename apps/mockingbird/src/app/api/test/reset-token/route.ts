import { prisma } from '@/_server/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const record = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return NextResponse.json({ error: 'No active token found' }, { status: 404 });
  }

  // If force_expire=1, backdate the token so it appears expired
  if (request.nextUrl.searchParams.get('force_expire') === '1') {
    await prisma.passwordResetToken.update({
      where: { token: record.token },
      data: { expiresAt: new Date(0) },
    });
  }

  return NextResponse.json({ token: record.token }, { status: 200 });
}
