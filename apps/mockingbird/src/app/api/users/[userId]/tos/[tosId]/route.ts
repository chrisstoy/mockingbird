import baseLogger from '@/_server/logger';
import { acceptTOS } from '@/_server/usersService';
import { DocumentIdSchema, UserIdSchema } from '@/_types';
import { respondWithError } from '@/app/api/errors';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:tos',
});

const ParamsSchema = z.object({
  userId: UserIdSchema,
  tosId: DocumentIdSchema,
});

/**
 * Accept the Terms of Service for a user.
 */
export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const { userId, tosId } = ParamsSchema.parse(await context.params);

    await acceptTOS(userId, tosId);
    return NextResponse.json({ accepted: tosId }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
