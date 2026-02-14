import { getFeed } from '@/_server/feedService';
import baseLogger from '@/_server/logger';
import { FeedSourceSchema, UserIdSchema } from '@/_types';
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

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await validateAuthentication();

    const { userId, feed: feedSource } = ParamsSchema.parse(
      await context.params
    );

    const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;

    logger.info(`Getting feed for userId: ${userId}`);

    const feed = await getFeed({ userId, feedSource, cursor });

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
