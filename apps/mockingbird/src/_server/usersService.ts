import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { UserId, UserInfoSchema } from '@/_types/users';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { actorIdForName, ActorSchema } from './activityPub/actorService';
import { Prisma } from '@prisma/client';

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
            // mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            // mode: 'insensitive',
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

  if (!rawData) {
    return undefined;
  }

  const user = UserInfoSchema.optional().parse(rawData);
  return user;
}

export async function createUser(
  name: string,
  email: string,
  password: string
) {
  logger.info(`Creating new user with name: '${name}' and email: ${email}`);

  const [newUser, newActor, passwordResult] = await prisma.$transaction(
    async (tx) => {
      const rawData = await tx.user.create({
        data: {
          email,
          name,
        },
      });

      const newUser = UserInfoSchema.parse(rawData);

      // create the activityPub actor for this user
      const actorId = await actorIdForName(newUser.name);
      const rawActor = await tx.actor.create({
        data: {
          userId: newUser.id,
          actorId,
          preferredUsername: newUser.name,
          name: newUser.name,
          summary: `Mockingbird created user: ${newUser.name}`,
          icon: null,
        },
      });
      const newActor = ActorSchema.parse(rawActor);

      // save password
      const today = new Date();
      const expiresAt = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate()
      );
      try {
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);
        const passwordResult = await tx.passwords.create({
          data: {
            userId: newUser.id,
            password: encryptedPassword,
            expiresAt,
          },
        });

        return [newUser, newActor, passwordResult];
      } catch (err) {
        logger.error(err);
        throw new Error('Failed to encrypt password');
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
    }
  );
  logger.info(
    `Created new user: ${JSON.stringify(newUser)}, new actor: ${JSON.stringify(
      newActor
    )}, with password expiration: ${passwordResult.expiresAt.toISOString()}`
  );
}

export async function deleteUser(userId: UserId) {
  try {
    const [
      commentsDeleted,
      postsDeleted,
      friendshipsDeleted,
      sessionsDeleted,
      // accountsDeleted,
      // passwordDeleted,
      // userDeleted,
    ] = await prisma.$transaction([
      // delete comments to Posts by user
      // prisma.post.deleteMany({
      //   where: {
      //     responseToPostId: {
      //       not: null, // ensure it is a response
      //     },
      //     responseTo: {
      //       posterId: userId, // original post was by user being deleted
      //     },
      //   },
      // }),

      // delete Posts by user
      // prisma.post.deleteMany({
      //   where: {
      //     posterId: userId,
      //   },
      // }),

      // delete Friendships
      // prisma.friends.deleteMany({
      //   where: {
      //     OR: [
      //       {
      //         userId: userId,
      //       },
      //       {
      //         friendId: userId,
      //       },
      //     ],
      //   },
      // }),

      // delete Sessions
      prisma.session.deleteMany({
        where: {
          userId: userId,
        },
      }),

      // delete Accounts
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
      // accountsDeleted,
      // passwordDeleted,
      // userDeleted,
    };

    logger.info(`DELETE User: ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    logger.error(`DELETE User: ERROR: ${error}`);
    throw error;
  }
}
