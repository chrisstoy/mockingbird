import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { auth } from '@/app/auth';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ResponseError } from '../../types';
import { createErrorResponse, respondWithError } from '../../users/service';
import { validateAuthentication } from '../../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:posts:post',
});

const paramsSchema = z.object({
  postId: z.string().min(1),
});

export const GET = auth(async function GET({ auth }, context) {
  try {
    validateAuthentication(auth);

    const { postId } = paramsSchema.parse(context.params);

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new ResponseError(404, `Post not found: ${postId}`);
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
});

export const DELETE = auth(async function DELETE({ auth }, context) {
  try {
    validateAuthentication(auth);

    const { postId } = paramsSchema.parse(context.params);

    const result = await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    if (!result) {
      throw new ResponseError(404, `Post not found: ${postId}`);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return createErrorResponse(404, `Post does not exist`);
    }

    logger.error(error);
    return respondWithError(error);
  }
});
