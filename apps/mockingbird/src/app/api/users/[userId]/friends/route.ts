import { NextResponse } from 'next/server';

import baseLogger from '@/_server/logger';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { auth } from '@/app/auth';
import { getFriendsForUser, respondWithError } from '../../service';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:user:friends',
});

const paramsSchema = z.object({
  userId: z.string().min(1),
});

export const GET = auth(async function GET({ auth }, context) {
  try {
    validateAuthentication(auth);

    const { userId } = paramsSchema.parse(context.params);

    logger.info(`Getting friends for userId: ${userId}`);

    const friends = await getFriendsForUser(userId);
    return NextResponse.json(friends, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
