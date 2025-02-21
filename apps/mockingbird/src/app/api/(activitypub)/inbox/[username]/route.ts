// user-specific inbox
import { NextRequest } from 'next/server';
import { respondWithError, ResponseError } from '@/app/api/errors';
import baseLogger from '@/_server/logger';
import { RouteContext } from '@/app/types';
import { z } from 'zod';
import { APActivity } from 'activitypub-types';

const logger = baseLogger.child({
  service: 'api:activitypub:inbox:username',
});

const ParamsSchema = z.object({
  username: z.string(),
});

// The inbox stream contains all activities received by the actor
// https://www.w3.org/TR/activitypub/#inbox
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { username } = ParamsSchema.parse(await context.params);

    const rawData = await req.json();
    const activity = rawData as APActivity;

    throw new ResponseError(405, `inbox not supported`);
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

// TODO - add WebFinger and Actor
// https://www.w3.org/TR/activitypub/#webfinger
// https://www.w3.org/TR/activitypub/#actor
