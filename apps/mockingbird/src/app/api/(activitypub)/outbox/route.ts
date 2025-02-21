import baseLogger from '@/_server/logger';
import { respondWithError, ResponseError } from '@/app/api/errors';
import { NextRequest } from 'next/server';

// Outbox serves data to callers of the ActivityPub protocol
// https://www.w3.org/TR/activitypub/#outbox

const logger = baseLogger.child({
  service: 'api:activitypub:outbox',
});

export async function GET(req: NextRequest) {
  try {
    throw new ResponseError(405, `outbox not supported`);
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
