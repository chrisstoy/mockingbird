import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { UserInfo } from '@/_types/users';
import { STATUS_CODES } from 'http';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ResponseError } from '../types';

const logger = baseLogger.child({
  service: 'users:service',
});

export async function requestFriendshipBetweenUsers(
  userId: string,
  friendId: string
) {
  const friendRequest = {
    userId,
    friendId,
    accepted: false,
  };

  return await prisma.friends.create({
    data: friendRequest,
  });
}

export async function updateFriendshipBetweenUsers(
  userId: string,
  friendId: string,
  accepted = true
) {
  const result = await prisma.friends.updateMany({
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
    data: {
      accepted,
    },
  });
  return result.count;
}

export async function deleteFriendshipBetweenUsers(
  userId: string,
  friendId: string
) {
  const result = await prisma.friends.deleteMany({
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
  return result.count;
}

export async function getUsersMatchingQuery(query: string) {
  logger.info(`Search for Users with query: ${query}`);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
  });
  return users;
}

export async function getAcceptedFriendsForUser(userId: string) {
  logger.info(`Getting accepted friends for userId: ${userId}`);

  const allFriends = await prisma.friends.findMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          friendId: userId,
        },
      ],
    },
    select: {
      userId: true,
      friendId: true,
      accepted: true,
    },
  });

  const acceptedFriendIds = allFriends
    .filter((friend) => friend.accepted)
    .map((friend) =>
      friend.userId === userId ? friend.friendId : friend.userId
    );

  return acceptedFriendIds;
}

/**
 * Return set of friends, pending requests, and friend requests for the given user
 * @param userId
 */
export async function getFriendsForUser(userId: string) {
  logger.info(`Getting friends for userId: ${userId}`);

  const allFriends = await prisma.friends.findMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          friendId: userId,
        },
      ],
    },
    select: {
      userId: true,
      friendId: true,
      accepted: true,
    },
  });

  const acceptedFriendIds = allFriends
    .filter((friend) => friend.accepted)
    .map((friend) =>
      friend.userId === userId ? friend.friendId : friend.userId
    );

  const pendingFriendIds = allFriends
    .filter((friend) => !friend.accepted && friend.userId === userId)
    .map(({ friendId }) => friendId);

  const friendRequestIds = allFriends
    .filter((friend) => !friend.accepted && friend.friendId === userId)
    .map(({ userId }) => userId);

  const friends = await prisma.user.findMany({
    where: {
      id: {
        in: acceptedFriendIds,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  const pendingFriends = await prisma.user.findMany({
    where: {
      id: {
        in: pendingFriendIds,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  const friendRequests = await prisma.user.findMany({
    where: {
      id: {
        in: friendRequestIds,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return {
    friends,
    pendingFriends,
    friendRequests,
  };
}

/**
 * Return set of users that the given user has sent friend requests to
 * and who have requested the user to be their friend
 */
export async function getFriendRequestsForUser(userId: string) {
  logger.info(`Getting friend requests for userId: ${userId}`);

  const pendingFriendRequestIds = await prisma.friends.findMany({
    where: {
      userId,
      accepted: false,
    },
    select: {
      friendId: true,
    },
  });

  const pendingRequestsByUser: UserInfo[] = await prisma.user.findMany({
    where: {
      id: {
        in: pendingFriendRequestIds.map(({ friendId }) => friendId),
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  const requestedToBeMyFriend = await prisma.friends.findMany({
    where: {
      friendId: userId,
      accepted: false,
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return {
    pendingRequestsByUser,
    friendRequestsForUser: requestedToBeMyFriend.map<UserInfo>(
      ({ user }) => user
    ),
  };
}

export async function getUserById(id: string) {
  logger.info(`Getting user with id: ${id}`);
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  return user;
}

export async function getUserByEmail(email: string) {
  logger.info(`Getting user with email: ${email}`);
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
}

export async function createUser(
  name: string,
  email: string,
  password: string
) {
  logger.info(`Creating new user with name: '${name}' and email: ${email}`);

  const newUser = await prisma.user.create({
    data: {
      email,
      name,
    },
  });

  const today = new Date();
  const expiresAt = new Date(
    today.getFullYear() + 1,
    today.getMonth(),
    today.getDate()
  );

  // encrypt password
  try {
    const encryptedPassword = password; //await argon2.hash(password);
    const passwordResult = await prisma.passwords.create({
      data: {
        userId: newUser.id,
        password: encryptedPassword,
        expiresAt,
      },
    });
    logger.info(
      `Created new user: ${newUser} with password expiration: ${passwordResult.expiresAt.toISOString()}`
    );
    return newUser.id;
  } catch (err) {
    logger.error(err);
    throw new Error('Failed to encrypt password');
  }
}

export function createErrorResponse(status: number, message: string) {
  const statusText = STATUS_CODES[status] || 'Error';
  return NextResponse.json({ message, status, statusText }, { status });
}

export function respondWithError(error: unknown) {
  if (error instanceof z.ZodError) {
    return createErrorResponse(400, `Invalid data: ` + JSON.stringify(error));
  }

  if (error instanceof ResponseError) {
    return createErrorResponse(error.status, error.message);
  }

  if (error instanceof Error) {
    return createErrorResponse(500, `${error.name}: ${error.message}`);
  }

  return createErrorResponse(500, `${error}`);
}
