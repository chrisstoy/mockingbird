import { prisma } from '@/_server/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email } = await request.json();
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

  const latestTos = await prisma.document.findFirst({
    where: { type: 'TOC' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (!latestTos) {
    return NextResponse.json({ error: 'No TOS document found' }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { acceptedToS: latestTos.id },
  });

  return NextResponse.json({ ok: true });
}
