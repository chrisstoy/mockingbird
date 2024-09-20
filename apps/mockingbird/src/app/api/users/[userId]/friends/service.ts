import baseLogger from '@/_server/logger';
import { prisma } from '@/_server/db';
import { z } from 'zod';
import { UserInfo } from '@/_types/users';

const logger = baseLogger.child({
  service: 'friends',
});

/**
 * Return list of users that are currently friends of the given user
 */
export async function getFriendsForUser(userId: string) {
  logger.info(`Getting friends for userId: ${userId}`);

  const friends = await prisma.friends.findMany({
    where: {
      userId,
      accepted: true,
    },
    select: {
      friendId: true,
    },
  });

  const peopleWhoFriendedMe = await prisma.friends.findMany({
    where: {
      friendId: userId,
      accepted: true,
    },
    select: {
      userId: true,
    },
  });

  const friendIds = [
    ...friends.map(({ friendId }) => friendId),
    ...peopleWhoFriendedMe.map(({ userId }) => userId),
  ];

  const friendUsers: UserInfo[] = await prisma.user.findMany({
    where: {
      id: {
        in: friendIds,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return friendUsers;
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
