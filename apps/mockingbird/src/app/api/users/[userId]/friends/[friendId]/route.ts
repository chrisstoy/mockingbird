import baseLogger from '@/_server/logger';
import { ResponseError } from '@/app/api/types';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  deleteFriendshipBetweenUsers,
  getAcceptedFriendsForUser,
  requestFriendshipBetweenUsers,
  respondWithError,
  updateFriendshipBetweenUsers,
} from '../../../service';

const logger = baseLogger.child({
  service: 'api:users:user:friends:friend',
});

const acceptFriendshipSchema = z.object({
  accepted: z.boolean(),
});

const paramsSchema = z.object({
  userId: z.string().min(1),
  friendId: z.string().min(1),
});

/**
 * Accept/paused a friend
 */
export const POST = auth(async function POST(request, context) {
  try {
    validateAuthentication(request.auth);

    const { userId, friendId } = paramsSchema.parse(context.params);

    const data = await request.json();
    const { accepted } = acceptFriendshipSchema.parse(data);

    const recordsUpdated = await updateFriendshipBetweenUsers(userId, friendId);
    if (recordsUpdated === 0) {
      throw new ResponseError(400, 'Friendship does not exist');
    }

    logger.info(
      `User ${userId} ${
        accepted ? 'accepted' : 'paused'
      } friendship with ${friendId}`
    );
    return NextResponse.json({ userId, friendId, accepted }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});

/** request a friend */
export const PUT = auth(async function PUT(request, context) {
  try {
    validateAuthentication(request.auth);

    const { userId, friendId } = paramsSchema.parse(context.params);

    const existingFriends = await getAcceptedFriendsForUser(userId);

    if (existingFriends.includes(friendId)) {
      logger.info(`User ${userId} already friends with ${friendId}`);
      return NextResponse.json(
        { userId, friendId, accepted: true },
        { status: 200 }
      );
    }

    const friendRequest = await requestFriendshipBetweenUsers(userId, friendId);

    logger.info(
      `User ${userId} requested to add friend ${friendId}. Friend request id: ${friendRequest.id}`
    );

    return NextResponse.json(
      { statusText: `Requested friendship with ${friendId}` },
      { status: 201 }
    );
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});

/** remove a friend */
export const DELETE = auth(async function DELETE({ auth }, context) {
  try {
    validateAuthentication(auth);

    const { userId, friendId } = paramsSchema.parse(context.params);

    const result = await deleteFriendshipBetweenUsers(userId, friendId);
    if (result === 0) {
      logger.warn(`User ${userId} does not have a friendship with ${friendId}`);
    } else {
      logger.info(`User ${userId} removed friendship with ${friendId}`);
    }

    return NextResponse.json(
      { statusText: `Removed friendship with ${friendId}` },
      { status: 200 }
    );
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
