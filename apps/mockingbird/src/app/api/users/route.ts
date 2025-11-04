import baseLogger from '@/_server/logger';
import {
  createUser,
  getUserByEmail,
  getUsersMatchingQuery,
} from '@/_server/usersService';
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
 * Create a new user profile (called after Supabase Auth signup)
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // For Supabase Auth, we expect id, name, and email
    // The user is already authenticated via Supabase, so we just create the profile
    const CreateUserProfileSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
    });

    const { id, name, email } = CreateUserProfileSchema.parse(data);

    // Check if user profile already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      // User already exists, this is okay - return success
      return NextResponse.json({ userId: existingUser.id }, { status: 200 });
    }

    // Create user profile in database
    const userId = await createUser(id as any, name, email);
    return NextResponse.json({ userId }, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
