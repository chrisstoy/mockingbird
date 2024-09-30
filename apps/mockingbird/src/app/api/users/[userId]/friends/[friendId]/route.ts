import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateFriendshiptBetweenUsers } from '../../../service';

const logger = baseLogger.child({
  service: 'api:users:user:friends:friend',
});

const AcceptFriendshipSchema = z.object({
  accepted: z.boolean(),
});

/**
 * Accept a friend
 */
export async function POST(request: Request, context: { params: Params }) {
  const userId = context.params.userId;
  const friendId = context.params.friendId;

  try {
    const data = await request.json();
    const { accepted } = AcceptFriendshipSchema.parse(data);

    if (accepted) {
      await updateFriendshiptBetweenUsers(userId, friendId);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { statusText: `Invalid data: ${error}` },
        { status: 500 }
      );
    }

    logger.error(error);
    throw error;
  }

  logger.info(`User ${userId} accepted friendship with ${friendId}`);
  return NextResponse.json(
    { statusText: `Requested friendship with ${friendId}` },
    { status: 201 }
  );
}

/** request a friend */
export async function PUT(request: Request, context: { params: Params }) {
  const userId = context.params.userId;
  const friendId = context.params.friendId;

  logger.info(`User ${userId} wants to add friend ${friendId}`);

  const existingFriend = await prisma.friends.findFirst({
    where: {
      userId,
      friendId,
    },
  });

  if (existingFriend) {
    return NextResponse.json(
      { statusText: `Already friends` },
      { status: 200 }
    );
  }

  const friendRequest = {
    userId,
    friendId,
    accepted: false,
  };

  try {
    await prisma.friends.create({
      data: friendRequest,
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }

  logger.info(`User ${userId} requested to add friend ${friendId}`);

  return NextResponse.json(
    { statusText: `Requested friendship with ${friendId}` },
    { status: 201 }
  );
}

/** remove a friend */
export async function DELETE(request: Request, context: { params: Params }) {
  const userId = context.params.userId;
  const friendId = context.params.friendId;

  try {
    await prisma.friends.deleteMany({
      where: {
        OR: [
          {
            userId,
            friendId,
          },
          {
            userId: friendId,
            friendId: userId,
          },
        ],
      },
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }

  logger.info(`User ${userId} Removed friend ${friendId}`);

  return NextResponse.json(
    { statusText: `Removed friend ${friendId}` },
    { status: 200 }
  );
}
