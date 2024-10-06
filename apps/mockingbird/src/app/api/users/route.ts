import baseLogger from '@/_server/logger';
import { createUserDataSchema } from '@/_types/createUser';
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import { ResponseError } from '../types';
import { validateAuthentication } from '../validateAuthentication';
import {
  createUser,
  getUserByEmail,
  getUsersMatchingQuery,
  respondWithError,
} from './service';

const logger = baseLogger.child({
  service: 'api:users',
});

/**
 * Get users matching the passed query string
 */
export const GET = auth(async function GET({ url: _url, auth }) {
  try {
    validateAuthentication(auth);

    const url = new URL(_url);
    const query = url.searchParams.get('q');

    logger.info(`Search for Users with query: ${query}`);

    if (!query?.length) {
      throw new ResponseError(500, 'No query provided');
    }

    logger.info(`Getting users that match query: ${query}`);

    const users = await getUsersMatchingQuery(query);

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});

/**
 * Create a new user
 */
export const POST = auth(async function POST(request) {
  try {
    validateAuthentication(request.auth);

    const data = await request.json();
    const { name, email, password } = createUserDataSchema.parse(data);

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
});
