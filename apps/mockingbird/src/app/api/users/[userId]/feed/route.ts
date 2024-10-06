import { NextResponse } from 'next/server';

import baseLogger from '@/_server/logger';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { auth } from '@/app/auth';
import { z } from 'zod';
import { respondWithError } from '../../service';
import { getFeedForUser } from './service';

const logger = baseLogger.child({
  service: 'api:users:user:feed',
});

const paramsSchema = z.object({
  userId: z.string().min(1),
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
