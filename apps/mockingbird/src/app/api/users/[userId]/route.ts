import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/_services/db';

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  const userToReturn = user
    ? {
        id: user.id,
        name: user.name,
        image: user.image,
      }
    : null;

  return NextResponse.json(userToReturn, { status: 200 });
}
