import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/_server/db';
import logger from '@/_server/logger';
import { CreateUser } from '@/_types/schemas';

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  logger.info(`GET /api/users/${userId}`);

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
