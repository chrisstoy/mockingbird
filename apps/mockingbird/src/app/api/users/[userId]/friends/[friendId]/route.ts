import {
  deleteFriendshipBetweenUsers,
  requestFriendshipBetweenUsers,
  updateFriendshipBetweenUsers,
} from '@/_server/friendsService';
import { createNotification } from '@/_server/notificationService';
import baseLogger from '@/_server/logger';
import { NotificationType, UserIdSchema } from '@/_types';
import { respondWithError, ResponseError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:user:friends:friend',
});

const AcceptFriendshipSchema = z.object({
  accepted: z.boolean(),
});

const ParamsSchema = z.object({
  userId: UserIdSchema,
  friendId: UserIdSchema,
});

/**
 * Accept or reject a friend request
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { userId, friendId } = ParamsSchema.parse(await context.params);
    if (session.user.id !== userId) {
      throw new ResponseError(403, 'Forbidden');
    }

    const data = await req.json();
    const { accepted } = AcceptFriendshipSchema.parse(data);

    const recordsUpdated = await updateFriendshipBetweenUsers(userId, friendId, accepted);
    if (recordsUpdated === 0) {
      throw new ResponseError(400, 'Friendship does not exist');
    }

    if (accepted) {
      // userId accepted the request; friendId was the original requester
      await createNotification({
        userId: friendId,
        type: NotificationType.FRIEND_REQUEST_ACCEPTED,
        actorId: userId,
      });
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
}

/**
 * Request a friend
 */
export async function PUT(_req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { userId, friendId } = ParamsSchema.parse(await context.params);
    if (session.user.id !== userId) {
      throw new ResponseError(403, 'Forbidden');
    }

    const friendRequest = await requestFriendshipBetweenUsers(userId, friendId);

    if (!friendRequest) {
      logger.info(`User ${userId} already has a friendship record with ${friendId}`);
      return NextResponse.json(
        { userId, friendId },
        { status: 200 }
      );
    }

    await createNotification({
      userId: friendId,
      type: NotificationType.FRIEND_REQUEST,
      actorId: userId,
      entityId: friendRequest.id,
    });

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
}

/**
 * Remove a friend
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { userId, friendId } = ParamsSchema.parse(await context.params);
    if (session.user.id !== userId) {
      throw new ResponseError(403, 'Forbidden');
    }

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
}
