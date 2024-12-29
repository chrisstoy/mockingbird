import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { createDatabaseIdSchema } from '@/_types/type-utilities';
import {
  EmailAddressSchema,
  UserId,
  UserIdSchema,
  UserInfo,
  UserInfoSchema,
} from '@/_types/users';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'users:service',
});

export type FriendshipRequstId = string & { __brand: 'FriendshipRequstId' };
const FriendshipRequestSchema = createDatabaseIdSchema<FriendshipRequstId>();

export async function requestFriendshipBetweenUsers(
  userId: UserId,
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
  userId: UserId,
  friendId: UserId,
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
  userId: UserId,
  friendId: UserId
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

const AcceptedFriendsSchema = z.array(
  z.object({
    userId: UserIdSchema.readonly(),
    friendId: UserIdSchema.readonly(),
    accepted: z.boolean().readonly(),
  })
);

export async function getAcceptedFriendsForUser(userId: UserId) {
  logger.info(`Getting accepted friends for userId: ${userId}`);

  const allFriends = AcceptedFriendsSchema.parse(
    await prisma.friends.findMany({
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
    })
  );

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
export async function getFriendsForUser(userId: UserId) {
  logger.info(`Getting friends for userId: ${userId}`);

  const allFriends = AcceptedFriendsSchema.parse(
    await prisma.friends.findMany({
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
    })
  );

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

  const friends = z.array(UserInfoSchema).parse(
    await prisma.user.findMany({
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
    })
  );

  const pendingFriends = z.array(UserInfoSchema).parse(
    await prisma.user.findMany({
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
    })
  );

  const friendRequests = z.array(UserInfoSchema).parse(
    await prisma.user.findMany({
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
    })
  );

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
export async function getFriendRequestsForUser(userId: UserId) {
  logger.info(`Getting friend requests for userId: ${userId}`);

  const PendingFriendRequestIdsSchema = z.array(
    z.object({ friendId: UserIdSchema })
  );

  const pendingFriendRequestIds = PendingFriendRequestIdsSchema.parse(
    await prisma.friends.findMany({
      where: {
        userId,
        accepted: false,
      },
      select: {
        friendId: true,
      },
    })
  );

  const pendingRequestsByUser = z.array(UserInfoSchema).parse(
    await prisma.user.findMany({
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
    })
  );

  const RequestedToBeMyFriendSchema = z.array(
    z.object({
      user: UserInfoSchema,
    })
  );

  const requestedToBeMyFriend = RequestedToBeMyFriendSchema.parse(
    await prisma.friends.findMany({
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
    })
  );

  return {
    pendingRequestsByUser,
    friendRequestsForUser: requestedToBeMyFriend.map<UserInfo>(
      ({ user }) => user
    ),
  };
}

export async function getUserById(id: UserId) {
  logger.info(`Getting user with id: ${id}`);
  const user = UserInfoSchema.optional().parse(
    await prisma.user.findUnique({
      where: {
        id,
      },
    })
  );
  return user;
}

export async function getUserByEmail(email: string) {
  logger.info(`Getting user with email: ${email}`);
  const user = UserInfoSchema.optional().parse(
    await prisma.user.findUnique({
      where: {
        email,
      },
    })
  );
  return user;
}

const CreateUserInfoSchema = UserInfoSchema.extend({
  email: EmailAddressSchema.optional(),
  emailVerified: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export async function createUser(
  name: string,
  email: string,
  password: string
) {
  logger.info(`Creating new user with name: '${name}' and email: ${email}`);

  const newUser = await CreateUserInfoSchema.parse(
    prisma.user.create({
      data: {
        email,
        name,
      },
    })
  );

  const today = new Date();
  const expiresAt = new Date(
    today.getFullYear() + 1,
    today.getMonth(),
    today.getDate()
  );

  try {
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);
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
