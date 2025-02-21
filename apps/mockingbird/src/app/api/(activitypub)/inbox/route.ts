import { NextRequest } from 'next/server';
import { respondWithError, ResponseError } from '@/app/api/errors';
import baseLogger from '@/_server/logger';

const logger = baseLogger.child({
  service: 'api:activitypub:outbox',
});

// The inbox stream contains all activities received by the actor
// https://www.w3.org/TR/activitypub/#inbox
export async function POST(req: NextRequest) {
  try {
    throw new ResponseError(405, `inbox not supported`);
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

// TODO - add WebFinger and Actor
// https://www.w3.org/TR/activitypub/#webfinger
// https://www.w3.org/TR/activitypub/#actor
