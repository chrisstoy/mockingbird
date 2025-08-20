import baseLogger from '@/_server/logger';
import { verifyTurnstile } from '@/_server/turnstileService';
import {
  createUser,
  getUserByEmail,
  getUsersMatchingQuery,
} from '@/_server/usersService';
import { CreateUserDataSchema } from '@/_types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../errors';
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
 * Create a new user
 */
export async function POST(req: NextRequest) {
  try {
    // We need to allow a non-authenticated call to create a user
    // BUT, we have to be careful not to expose ourselves to malicious attacks.

    const data = await req.json();
    const { name, email, password, turnstileToken } =
      CreateUserDataSchema.parse(data);

    const isTurnstileValid = req.url.includes('localhost')
      ? true
      : turnstileToken
      ? await verifyTurnstile(turnstileToken)
      : false;

    if (!isTurnstileValid) {
      return NextResponse.json(
        { success: false, message: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new ResponseError(409, `User with email '${email}' already exists`);
    }

    const userId = await createUser(name, email, password);
    return NextResponse.json({ userId }, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
