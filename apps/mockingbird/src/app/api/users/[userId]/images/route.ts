import { listImagesForUser, storeImageForUser } from '@/_server/imagesService';
import baseLogger from '@/_server/logger';
import { AlbumIdSchema } from '@/_types/images';
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
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { userId } = ParamsSchema.parse(await context.params);

    const result = await listImagesForUser(userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

/**
 * Upload an image for the user
 * form data:
 *   - image: File
 *   - description?: string
 *   - albumId?: AlbumId
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { data, success, error } = ParamsSchema.safeParse(
      await context.params
    );
    if (!success) {
      return createErrorResponse(400, error.message);
    }
    const { userId } = data;

    if (session.user?.id !== userId) {
      throw new ResponseError(
        400,
        `userId ${userId} does not match the logged in userId ${session.user?.id}`
      );
    }

    // Parse the incoming form data
    const formData = await req.formData();

    const fileBlob = formData.get('file');
    const file = fileBlob instanceof File ? fileBlob : undefined;
    if (!file) {
      throw new ResponseError(409, 'No Image Provided');
    }

    const schema = z.object({
      file: z.instanceof(File),
      description: z.string().optional(),
      albumId: AlbumIdSchema.optional(),
    });

    const fd = await schema.parse({
      file: file,
      description: formData.get('description'),
      album: formData.get('album'),
    });

    const result = await storeImageForUser(
      userId,
      file,
      fd.description,
      fd.albumId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
