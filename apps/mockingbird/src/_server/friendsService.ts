import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import {
  FriendStatus,
  SimpleUserInfo,
  SimpleUserInfoSchema,
  UserId,
  UserIdSchema,
} from '@/_types';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'friends:service',
});

/**
 * Atomically check for an existing friendship/request and create one if absent.
 * Returns the new record, or null if a friendship/request already exists.
 */
export async function requestFriendshipBetweenUsers(
  userId: UserId,
  friendId: UserId
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.friends.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existing) {
      return null;
    }

    return tx.friends.create({
      data: { userId, friendId, status: 'PENDING' },
    });
  });
}

export async function updateFriendshipBetweenUsers(
  userId: UserId,
  friendId: UserId,
  accepted = true
) {
  const result = await prisma.friends.updateMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
    data: {
      status: accepted ? 'ACCEPTED' : 'REJECTED',
    },
  });
  return result.count;
}

export async function deleteFriendshipBetweenUsers(
  userId: UserId,
  friendId: UserId
) {
  const result = await prisma.friends.deleteMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });
  return result.count;
}

const FriendRecordSchema = z.array(
  z.object({
    userId: UserIdSchema.readonly(),
    friendId: UserIdSchema.readonly(),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).readonly(),
  })
);

export async function getAcceptedFriendsForUser(userId: UserId) {
  logger.info(`Getting accepted friends for userId: ${userId}`);

  const allFriends = FriendRecordSchema.parse(
    await prisma.friends.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
      select: {
        userId: true,
        friendId: true,
        status: true,
      },
    })
  );

  const acceptedFriendIds = allFriends
    .filter((friend) => friend.status === 'ACCEPTED')
    .map((friend) =>
      friend.userId === userId ? friend.friendId : friend.userId
    );

  return acceptedFriendIds;
}

/**
 * Return set of friends, pending requests, and friend requests for the given user
 */
export async function getFriendsForUser(userId: UserId) {
  logger.info(`Getting friends for userId: ${userId}`);

  const rawData = await prisma.friends.findMany({
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
      status: true,
    },
  });

  const allFriends = FriendRecordSchema.parse(rawData);

  const acceptedFriendIds = allFriends
    .filter((friend) => friend.status === 'ACCEPTED')
    .map((friend) =>
      friend.userId === userId ? friend.friendId : friend.userId
    );

  const pendingFriendIds = allFriends
    .filter((friend) => friend.status === 'PENDING' && friend.userId === userId)
    .map(({ friendId }) => friendId);

  const friendRequestIds = allFriends
    .filter((friend) => friend.status === 'PENDING' && friend.friendId === userId)
    .map(({ userId }) => userId);

  const [rawFriends, rawPendingFriends, rawFriendRequests] =
    await prisma.$transaction([
      prisma.user.findMany({
        where: {
          id: {
            in: acceptedFriendIds as unknown as string[],
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),

      prisma.user.findMany({
        where: {
          id: {
            in: pendingFriendIds as unknown as string[],
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),

      prisma.user.findMany({
        where: {
          id: {
            in: friendRequestIds as unknown as string[],
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),
    ]);

  const friends = z.array(SimpleUserInfoSchema).parse(rawFriends);
  const pendingFriends = z.array(SimpleUserInfoSchema).parse(rawPendingFriends);
  const friendRequests = z.array(SimpleUserInfoSchema).parse(rawFriendRequests);

  return {
    friends,
    pendingFriends,
    friendRequests,
  };
}

/**
 * Return the friend status between two users from currentUserId's perspective.
 * Used server-side in post/comment headers to determine what affordance to show.
 *
 * Returns:
 * - 'friend'    — accepted friendship (either direction)
 * - 'pending'   — currentUser sent a request, awaiting response
 * - 'requested' — authorId sent a request to currentUser
 * - 'rejected'  — currentUser's request was rejected by authorId
 * - 'none'      — no relationship, or currentUser rejected authorId (they can re-request)
 */
export async function getFriendStatusBetweenUsers(
  currentUserId: UserId,
  authorId: UserId
): Promise<FriendStatus> {
  const record = await prisma.friends.findFirst({
    where: {
      OR: [
        { userId: currentUserId, friendId: authorId },
        { userId: authorId, friendId: currentUserId },
      ],
    },
    select: { userId: true, status: true },
  });

  if (!record) return 'none';
  if (record.status === 'ACCEPTED') return 'friend';
  if (record.status === 'REJECTED') {
    return record.userId === currentUserId ? 'rejected' : 'none';
  }
  // PENDING
  return record.userId === currentUserId ? 'pending' : 'requested';
}

/**
 * Return set of users that the given user has sent friend requests to
 * and who have requested the user to be their friend
 */
export async function getFriendRequestsForUser(userId: UserId) {
  logger.info(`Getting friend requests for userId: ${userId}`);

  const PendingFriendRequestIdsSchema = z.array(
    z.object({ friendId: UserIdSchema })
  );

  const pendingFriendRequestIds = PendingFriendRequestIdsSchema.parse(
    await prisma.friends.findMany({
      where: { userId, status: 'PENDING' },
      select: { friendId: true },
    })
  );

  const pendingRequestsByUser = z.array(SimpleUserInfoSchema).parse(
    await prisma.user.findMany({
      where: {
        id: {
          in: pendingFriendRequestIds.map(({ friendId }) => friendId),
        },
      },
      select: { id: true, name: true, image: true },
    })
  );

  const RequestedToBeMyFriendSchema = z.array(
    z.object({
      user: SimpleUserInfoSchema,
    })
  );

  const requestedToBeMyFriend = RequestedToBeMyFriendSchema.parse(
    await prisma.friends.findMany({
      where: { friendId: userId, status: 'PENDING' },
      select: {
        user: { select: { id: true, name: true, image: true } },
      },
    })
  );

  return {
    pendingRequestsByUser,
    friendRequestsForUser: requestedToBeMyFriend.map<SimpleUserInfo>(
      ({ user }) => user
    ),
  };
}
