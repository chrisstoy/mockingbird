import { validateActivity } from '@/_server/activityPub/activityService';
import { getNotesForActor } from '@/_server/activityPub/noteService';
import { processOutboxActivity } from '@/_server/activityPub/outboxService';
import { APActivitySchema, APUID } from '@/_server/activityPub/schemas';
import baseLogger from '@/_server/logger';
import { respondWithError, ResponseError } from '@/app/api/errors';
import {
  getAuthenticatedActor,
  validateAuthentication,
} from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
import { APActivity } from 'activitypub-types';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Outbox serves data to callers of the ActivityPub protocol
// https://www.w3.org/TR/activitypub/#outbox

const ParamsSchema = z.object({
  username: z.string(),
});

const logger = baseLogger.child({
  service: 'api:activitypub:actors:outbox',
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    // validate the the actor is the same as the logged in user
    const session = await validateAuthentication();
    const { username } = ParamsSchema.parse(await context.params);
    if (session.user.name !== username) {
      throw new ResponseError(401, `Unauthorized`);
    }

    const rawData = await req.json();
    const {
      data: activity,
      success,
      error,
    } = APActivitySchema.safeParse(rawData);
    if (!success) {
      throw new ResponseError(401, `Activity is not valid: ${error}`);
    }

    const result = await processOutboxActivity(activity);
    return result;
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

/**
 * Returns the OrderedCollection of Notes created by this Actor
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // validate the the actor is the same as the logged in user
    const session = await validateAuthentication();
    const { username } = ParamsSchema.parse(await context.params);
    if (session.user.name !== username) {
      throw new ResponseError(401, `Unauthorized`);
    }

    const actor = await getAuthenticatedActor();
    if (!actor || !actor.id) {
      throw new ResponseError(404, `Actor '${username}' does not exist`);
    }

    const notes = await getNotesForActor(actor.id as APUID);

    // TODO: fetch all Notes for this user
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
