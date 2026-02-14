import { getFriendsForUser } from '@/_server/friendsService';
import baseLogger from '@/_server/logger';
import { UserIdSchema } from '@/_types';
import { createErrorResponse, respondWithError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:user:friends',
});

const ParamsSchema = z.object({
  userId: UserIdSchema,
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { data, success, error } = ParamsSchema.safeParse(
      await context.params
    );
    if (!success) {
      return createErrorResponse(400, error.message);
    }
    const { userId } = data;

    if (session.user.id !== userId) {
      return createErrorResponse(403, 'Forbidden');
    }

    const friends = await getFriendsForUser(userId);
    return NextResponse.json(friends, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
