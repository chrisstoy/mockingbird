import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { getAcceptedFriendsForUser } from '../../service';

const logger = baseLogger.child({
  service: 'api:users:user:feed',
});

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  logger.info(`Getting feed for userId: ${userId}`);

  // the user's feed consists of all top-level posts by the user
  // as well as all top-level posts by the user's friends.
  const userIdsForFeed = await getAcceptedFriendsForUser(userId);
  userIdsForFeed.push(userId);

  const posts = await prisma.post.findMany({
    where: {
      posterId: { in: userIdsForFeed },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return NextResponse.json(posts, { status: 200 });
}
