import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { DocumentId, UserId, UserInfoSchema } from '@/_types';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

/**
 * Creates a user record in the database
 * Note: User is already created in Supabase Auth before this is called
 * This just creates the corresponding database record
 */
export async function createUser(id: UserId, name: string, email: string) {
  logger.info(
    `Creating new user record with id: ${id}, name: '${name}' and email: ${email}`
  );

  const rawData = await prisma.user.create({
    data: {
      id, // Use the Supabase Auth user ID
      email,
      name,
    },
  });

  const newUser = UserInfoSchema.parse(rawData);
  logger.info(`Created new user record: ${newUser.id}`);

  return newUser.id;
}

export async function deleteUser(userId: UserId) {
  try {
    const [
      commentsDeleted,
      postsDeleted,
      friendshipsDeleted,
      sessionsDeleted,
      accountsDeleted,
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

      // Passwords table removed - Supabase Auth handles password storage

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
      userDeleted,
    };

    logger.info(`DELETE User: ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    logger.error(`DELETE User: ERROR: ${error}`);
    throw error;
  }
}

/**
 * Records that a user accepted the Terms of Service
 * Stores in Supabase Auth user_metadata
 */
export async function acceptTOS(userId: UserId, tosId: DocumentId) {
  logger.info(`User ${userId} accepted TOS ${tosId}`);

  // Create admin client with service role key for admin operations
  const supabase = createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Update Supabase Auth user metadata
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      acceptedToS: tosId,
    },
  });

  if (error) {
    logger.error(`Failed to update user metadata: ${error.message}`);
    throw new Error('Failed to accept TOS');
  }

  logger.info(`User ${userId} TOS acceptance recorded in user_metadata`);
}

/**
 * Checks if a user has accepted a specific TOS version
 */
export async function hasAcceptedTOS(
  userId: UserId,
  tosId: DocumentId
): Promise<boolean> {
  // Create admin client with service role key for admin operations
  const supabase = createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.admin.getUserById(userId);

  if (error || !user) {
    logger.error(`Failed to get user: ${error?.message}`);
    return false;
  }

  const acceptedToS = user.user_metadata?.acceptedToS;
  return acceptedToS === tosId;
}
