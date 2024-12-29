import baseLogger from '@/_server/logger';
import { UserIdSchema } from '@/_types/users';
import { respondWithError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFriendsForUser } from '../../service';

const logger = baseLogger.child({
  service: 'api:users:user:friends',
});

const paramsSchema = z.object({
  userId: UserIdSchema,
});

export const GET = auth(async function GET({ auth }, context) {
  try {
    validateAuthentication(auth);

    const { userId } = paramsSchema.parse(context.params);

    const friends = await getFriendsForUser(userId);
    return NextResponse.json(friends, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
