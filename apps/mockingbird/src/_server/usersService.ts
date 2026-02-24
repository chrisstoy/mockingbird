import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { DocumentId, UserId, UserInfoSchema } from '@/_types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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

export async function updateUserImage(userId: UserId, imageUrl: string) {
  logger.info(`Updating profile image for user ${userId}`);
  return await prisma.user.update({
    data: { image: imageUrl },
    where: { id: userId },
  });
}

export async function createPasswordResetToken(
  userId: UserId
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function validateAndConsumePasswordResetToken(
  token: string
): Promise<string> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired token');
  }

  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return record.userId;
}

export async function updateUserPassword(
  userId: UserId,
  newPassword: string
): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await prisma.passwords.upsert({
    where: { userId },
    create: { userId, password: hash, expiresAt },
    update: { password: hash, expiresAt },
  });
}

export async function expireUserPassword(userId: UserId): Promise<void> {
  await prisma.passwords.update({
    where: { userId },
    data: { expiresAt: new Date() },
  });
}

export async function verifyUserPassword(
  userId: UserId,
  password: string
): Promise<boolean> {
  const record = await prisma.passwords.findUnique({ where: { userId } });
  if (!record) return false;
  return bcrypt.compare(password, record.password);
}

export async function acceptTOS(userId: UserId, tosId: DocumentId) {
  logger.info(`User ${userId} accepted TOS ${tosId}`);

  return await prisma.user.update({
    data: { acceptedToS: tosId },
    where: {
      id: userId,
    },
  });
}
