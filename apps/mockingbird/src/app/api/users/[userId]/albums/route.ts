import { getOrCreateAlbumByName } from '@/_server/imagesService';
import baseLogger from '@/_server/logger';
import { UserIdSchema } from '@/_types';
import { respondWithError, ResponseError } from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({ service: 'api:users:user:albums' });

const ParamsSchema = z.object({ userId: UserIdSchema });

/**
 * Find or create an album by name for the authenticated user.
 * Body: { name: string }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { userId } = ParamsSchema.parse(await context.params);

    if (session.user?.id !== userId) {
      throw new ResponseError(
        403,
        `User ${session.user?.id} cannot manage albums for user ${userId}`
      );
    }

    const { name } = z.object({ name: z.string().min(1) }).parse(await req.json());

    const album = await getOrCreateAlbumByName(userId, name);
    return NextResponse.json(album, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
