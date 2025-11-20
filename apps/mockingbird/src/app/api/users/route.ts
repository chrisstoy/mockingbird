import baseLogger from '@/_server/logger';
import { getUserByEmail, getUsersMatchingQuery } from '@/_server/usersService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError } from '../errors';
import { validateAuthentication } from '../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:users',
});

const QueryParamsSchema = z.object({
  q: z.string().min(1, 'No query provided'),
});

/**
 * Get users matching the passed query string
 */
export async function GET(req: NextRequest) {
  try {
    await validateAuthentication();

    const { q: query } = QueryParamsSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    logger.info(`Getting users that match query: ${query}`);

    const users = await getUsersMatchingQuery(query);

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

/**
 * Verify user profile creation (called after Supabase Auth signup)
 *
 * NOTE: User creation is now automatic via PostgreSQL triggers.
 * When a user is created in Supabase Auth, the on_auth_user_created trigger
 * automatically creates the corresponding User record.
 *
 * This endpoint now just verifies the user was created successfully.
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const VerifyUserProfileSchema = z.object({
      id: z.string().uuid(),
      email: z.string().email(),
    });

    const { id, email } = VerifyUserProfileSchema.parse(data);

    // Wait a moment for the trigger to complete (it's async)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify user profile was created by trigger
    const user = await getUserByEmail(email);
    if (!user) {
      logger.error(`User profile not found after signup for ${email}`);
      throw new Error('User profile creation failed');
    }

    logger.info(`User profile verified for ${email}`);
    return NextResponse.json({ userId: user.id }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
