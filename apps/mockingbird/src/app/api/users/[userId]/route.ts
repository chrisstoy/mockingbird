import { NextResponse } from 'next/server';

import baseLogger from '@/_server/logger';
import { auth } from '@/app/auth';
import { AppRouteHandlerFnContext } from 'next-auth/lib/types';
import { z } from 'zod';
import { ResponseError } from '../../types';
import { validateAuthentication } from '../../validateAuthentication';
import { getUserById, respondWithError } from '../service';

const logger = baseLogger.child({
  service: 'api:users:user',
});

const paramsSchema = z.object({
  userId: z.string().min(1),
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

    const userToReturn = user
      ? {
          id: user.id,
          name: user.name,
          image: user.image,
        }
      : null;

    return NextResponse.json(userToReturn, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});
