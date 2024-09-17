import { prisma } from '@/_server/db';
import logger from '@/_server/logger';
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';
import { NextResponse } from 'next/server';

/** add a friend */
export async function PUT(request: Request, context: { params: Params }) {
  // const  = await request.json();
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
    const result = await prisma.friends.create({
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
    const result = await prisma.friends.deleteMany({
      where: {
        userId,
        friendId,
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
