import { getFeed } from '@/_server/feedService';
import baseLogger from '@/_server/logger';
import { FeedSourceSchema } from '@/_types/feeds';
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
  feed: FeedSourceSchema,
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await validateAuthentication();

    const { userId, feed: feedSource } = ParamsSchema.parse(
      await context.params
    );

    logger.info(`Getting feed for userId: ${userId}`);

    const feed = await getFeed({ userId, feedSource });

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
