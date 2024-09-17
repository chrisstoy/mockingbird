import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import logger from '@/_server/logger';
import { prisma } from '@/_server/db';
import { z } from 'zod';

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  logger.info(`Getting friends for userId: ${userId}`);

  const allFriends = await prisma.friends.findMany({
    where: {
      userId,
    },
    select: {
      friendId: true,
      accepted: true,
    },
  });

  const friends = await prisma.user.findMany({
    where: {
      id: {
        in: allFriends.map(({ friendId }) => friendId),
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return NextResponse.json(
    {
      friends: friends.filter(
        ({ id }) =>
          allFriends.find(({ friendId }) => friendId === id)?.accepted === true
      ),
      pendingFriends: friends.filter(
        ({ id }) =>
          allFriends.find(({ friendId }) => friendId === id)?.accepted === false
      ),
    },
    { status: 200 }
  );
}
