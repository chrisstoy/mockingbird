import { getActorByName } from '@/_server/activityPub/actorService';
import baseLogger from '@/_server/logger';
import { respondWithError, ResponseError } from '@/app/api/errors';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:activitypub:actors',
});

const ParamsSchema = z.object({
  username: z.string(),
});

// https://www.w3.org/TR/activitypub/#actor

// Return the local actor account information
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { username } = ParamsSchema.parse(await context.params);
    const actor = await getActorByName(username);

    if (!actor) {
      throw new ResponseError(404, `Actor '${username}' does not exist`);
    }

    return NextResponse.json(actor, {
      headers: {
        'Content-Type': 'application/jrd+json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
