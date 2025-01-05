import { NextRequest, NextResponse } from 'next/server';

import baseLogger from '@/_server/logger';
import { deleteUser, getUserById } from '@/_server/usersService';
import { UserIdSchema } from '@/_types/users';
import { RouteContext } from '@/app/types';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:users:user',
});

const ParamsSchema = z.object({
  userId: UserIdSchema,
});

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await validateAuthentication();

    const { userId } = ParamsSchema.parse(params);
    const user = await getUserById(userId);
    if (!user) {
      throw new ResponseError(404, `User '${userId}' does not exist`);
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

/**
 * Delete the requested user.
 *
 * Only the user themselves or an admin can delete their account
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { userId } = ParamsSchema.parse(params);

    if (userId !== session.user?.id) {
      throw new ResponseError(
        403,
        `User ${session.user?.id} tried to delete user ${userId}`
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
}
