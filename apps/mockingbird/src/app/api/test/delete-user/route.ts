import { prisma } from '@/_server/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
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
    return new Response(null, { status: 204 });
  }

  const userId = user.id;
  await prisma.$transaction([
    prisma.post.deleteMany({
      where: {
        responseToPostId: { not: null },
        responseTo: { posterId: userId },
      },
    }),
    prisma.post.deleteMany({ where: { posterId: userId } }),
    prisma.friends.deleteMany({
      where: { OR: [{ userId }, { friendId: userId }] },
    }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.userPermission.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return new Response(null, { status: 204 });
}
