import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';

const logger = baseLogger.child({
  service: 'api:users:user',
});

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  logger.info(`Getting user: ${userId}`);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return NextResponse.json(
      { statusText: `User '${userId}' does not exist` },
      { status: 404 }
    );
  }

  const userToReturn = user
    ? {
        id: user.id,
        name: user.name,
        image: user.image,
      }
    : null;

  return NextResponse.json(userToReturn, { status: 200 });
}
