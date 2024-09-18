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

  logger.info(`Getting feed for userId: ${userId}`);

  // the user's feed consists of all top-level posts by the user
  // as well as all top-level posts by the user's friends.
  const friends = await prisma.friends.findMany({
    where: {
      userId,
      accepted: true,
    },
    select: {
      friendId: true,
    },
  });

  const friendIds = [userId, ...friends.map(({ friendId }) => friendId)];

  const posts = await prisma.post.findMany({
    where: {
      posterId: { in: friendIds },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return NextResponse.json(posts, { status: 200 });
}
