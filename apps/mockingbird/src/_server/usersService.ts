import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { UserId, UserInfoSchema } from '@/_types/users';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'users:service',
});

export async function getUsersMatchingQuery(query: string) {
  logger.info(`Search for Users with query: ${query}`);

  const rawData = await prisma.user.findMany({
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

  const users = z.array(UserInfoSchema).parse(rawData);
  return users;
}

export async function getUserById(id: UserId) {
  logger.info(`Getting user with id: ${id}`);
  const rawData = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!rawData) {
    return undefined;
  }

  const user = UserInfoSchema.optional().parse(rawData);
  return user;
}

export async function getUserByEmail(email: string) {
  logger.info(`Getting user with email: ${email}`);

  const rawData = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  const user = UserInfoSchema.optional().parse(rawData);
  return user;
}

export async function createUser(
  name: string,
  email: string,
  password: string
) {
  logger.info(`Creating new user with name: '${name}' and email: ${email}`);

  const rawData = await prisma.user.create({
    data: {
      email,
      name,
    },
  });

  const newUser = UserInfoSchema.parse(rawData);

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

export async function deleteUser(userId: UserId) {
  try {
    const [
      commentsDeleted,
      postsDeleted,
      friendshipsDeleted,
      sessionsDeleted,
      accountsDeleted,
      passwordDeleted,
      userDeleted,
    ] = await prisma.$transaction([
      // delete comments to Posts by user
      prisma.post.deleteMany({
        where: {
          responseToPostId: {
            not: null, // ensure it is a response
          },
          responseTo: {
            posterId: userId, // original post was by user being deleted
          },
        },
      }),

      // delete Posts by user
      prisma.post.deleteMany({
        where: {
          posterId: userId,
        },
      }),

      // delete Friendships
      prisma.friends.deleteMany({
        where: {
          OR: [
            {
              userId: userId,
            },
            {
              friendId: userId,
            },
          ],
        },
      }),

      // delete Accounts
      prisma.session.deleteMany({
        where: {
          userId: userId,
        },
      }),

      // delete Sessions
      prisma.account.deleteMany({
        where: {
          userId: userId,
        },
      }),

      // delete Password
      prisma.passwords.delete({
        where: {
          userId: userId,
        },
      }),

      // delete User
      prisma.user.delete({
        where: {
          id: userId,
        },
      }),
    ]);

    const results = {
      commentsDeleted,
      postsDeleted,
      friendshipsDeleted,
      sessionsDeleted,
      accountsDeleted,
      passwordDeleted,
      userDeleted,
    };

    logger.info(`DELETE User: ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    logger.error(`DELETE User: ERROR: ${error}`);
    throw error;
  }
}
