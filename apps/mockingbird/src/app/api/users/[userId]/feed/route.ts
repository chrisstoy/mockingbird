import { getFeedForUser } from '@/_server/feedService';
import baseLogger from '@/_server/logger';
import { UserIdSchema } from '@/_types/users';
import { respondWithError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:user:feed',
});

const paramsSchema = z.object({
  userId: UserIdSchema,
});

export const GET = auth(async function GET(request, context) {
  try {
    validateAuthentication(request.auth);

    const { userId } = paramsSchema.parse(context.params);

    logger.info(`Getting feed for userId: ${userId}`);

    const feed = await getFeedForUser(userId);

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
