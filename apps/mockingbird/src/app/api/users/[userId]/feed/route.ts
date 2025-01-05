import { getFeedForUser } from '@/_server/feedService';
import baseLogger from '@/_server/logger';
import { UserIdSchema } from '@/_types/users';
import { respondWithError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:user:feed',
});

const ParamsSchema = z.object({
  userId: UserIdSchema,
});

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await validateAuthentication();

    const { userId } = ParamsSchema.parse(params);

    logger.info(`Getting feed for userId: ${userId}`);

    const feed = await getFeedForUser(userId);

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
