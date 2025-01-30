import { deleteImageForUser, getImage } from '@/_server/imagesService';
import baseLogger from '@/_server/logger';
import { ImageIdSchema } from '@/_types/images';
import { UserIdSchema } from '@/_types/users';
import {
  createErrorResponse,
  respondWithError,
  ResponseError,
} from '@/app/api/errors';
import { validateAuthentication } from '@/app/api/validateAuthentication';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users:user:images',
});

const ParamsSchema = z.object({
  userId: UserIdSchema,
  imageId: ImageIdSchema,
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await validateAuthentication();

    const { data, success, error } = ParamsSchema.safeParse(
      await context.params
    );
    if (!success) {
      return createErrorResponse(400, error.message);
    }
    const { userId, imageId } = data;

    const image = await getImage(imageId);

    if (!image) {
      return createErrorResponse(404, `Image not found: ${imageId}`);
    }

    return NextResponse.json(image, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await validateAuthentication();

    const { data, success, error } = ParamsSchema.safeParse(
      await context.params
    );
    if (!success) {
      return createErrorResponse(400, error.message);
    }
    const { userId, imageId } = data;

    const deletedImage = await deleteImageForUser(userId, imageId);
    if (!deletedImage) {
      throw new ResponseError(404, `Image not found: ${imageId}`);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
