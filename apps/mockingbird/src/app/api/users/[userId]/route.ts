import { NextResponse } from 'next/server';

import baseLogger from '@/_server/logger';
import { deleteUser, getUserById } from '@/_server/usersService';
import { UserIdSchema } from '@/_types/users';
import { auth } from '@/app/auth';
import { AppRouteHandlerFnContext } from 'next-auth/lib/types';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:users:user',
});

const paramsSchema = z.object({
  userId: UserIdSchema,
});

export const GET = auth(async function GET(
  { auth },
  context: AppRouteHandlerFnContext
) {
  try {
    validateAuthentication(auth);

    const { userId } = paramsSchema.parse(context.params);

    const user = await getUserById(userId);
    if (!user) {
      throw new ResponseError(404, `User '${userId}' does not exist`);
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});

/**
 * Delete the requested user.
 * Only the user themselves or an admin can delete their account
 */
export const DELETE = auth(async function DELETE({ auth }, context) {
  try {
    validateAuthentication(auth);

    const { userId } = paramsSchema.parse(context.params);

    if (userId !== auth?.user?.id) {
      throw new ResponseError(
        403,
        `User ${auth?.user?.id} tried to delete user ${userId}`
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new ResponseError(404, `User '${userId}' does not exist`);
    }

    const results = await deleteUser(userId);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
