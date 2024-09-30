import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { UserInfo } from '@/_types/users';

const logger = baseLogger.child({
  service: 'users:service',
});

export async function updateFriendshiptBetweenUsers(
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
  return result;
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
