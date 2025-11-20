import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { DocumentId, UserId, UserInfoSchema } from '@/_types';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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

/**
 * NOTE: User creation is now handled automatically by PostgreSQL triggers.
 * When a user is created in Supabase Auth (auth.users), the trigger
 * on_auth_user_created automatically creates the corresponding User record.
 *
 * No manual User table creation is needed - just create the user via
 * Supabase Auth and the trigger handles the rest.
 */

/**
 * Deletes a user from Supabase Auth, which automatically triggers deletion
 * of the User record and all related data via PostgreSQL triggers and foreign key cascades.
 *
 * Flow:
 * 1. Delete user from auth.users (Supabase Auth)
 * 2. on_auth_user_deleted trigger deletes from User table
 * 3. Foreign key CASCADE deletes remove Posts, Friends, Images, Albums
 */
export async function deleteUser(userId: UserId) {
  try {
    logger.info(`Deleting user ${userId} from Supabase Auth`);

    // Create admin client with service role key
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

    // Delete from Supabase Auth - triggers cascade via PostgreSQL triggers
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      logger.error(
        `Failed to delete user from Supabase Auth: ${error.message}`
      );
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    const results = {
      userId,
    };

    logger.info(`DELETE User: ${JSON.stringify(results)}`);
    return results;

    return true;
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
