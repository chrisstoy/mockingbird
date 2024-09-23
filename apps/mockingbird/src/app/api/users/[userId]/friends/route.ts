import { NextRequest, NextResponse } from 'next/server';

import baseLogger from '@/_server/logger';
import { getFriendRequestsForUser, getFriendsForUser } from '../../service';

const logger = baseLogger.child({
  service: 'api:users:user:friends',
});

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  logger.info(`Getting friends for userId: ${userId}`);

  const friends = await getFriendsForUser(userId);

  return NextResponse.json(friends, { status: 200 });
}
