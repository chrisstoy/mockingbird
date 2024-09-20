import { NextRequest, NextResponse } from 'next/server';

import baseLogger from '@/_server/logger';
import { getFriendRequestsForUser, getFriendsForUser } from './service';

const logger = baseLogger.child({
  service: 'api:users:user:friends',
});

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  logger.info(`APIGetting friends for userId: ${userId}`);

  const friends = await getFriendsForUser(userId);

  const { pendingRequestsByUser, friendRequestsForUser } =
    await getFriendRequestsForUser(userId);

  return NextResponse.json(
    {
      friends,
      pendingFriends: pendingRequestsByUser,
      friendRequests: friendRequestsForUser,
    },
    { status: 200 }
  );
}
