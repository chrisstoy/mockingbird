import { getFriendsForUser } from '@/_server/friendsService';
import baseLogger from '@/_server/logger';
import { UserIdSchema } from '@/_types/users';
import { createErrorResponse, respondWithError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:user:friends',
});

const ParamsSchema = z.object({
  userId: UserIdSchema,
});

export const GET = auth(async function GET({ auth }, context) {
  try {
    validateAuthentication(auth);

    const result = ParamsSchema.safeParse(context.params);
    if (!result.success) {
      return createErrorResponse(400, result.error.message);
    }
    const { userId } = result.data;

    const friends = await getFriendsForUser(userId);
    return NextResponse.json(friends, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
