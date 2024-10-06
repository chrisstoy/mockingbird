import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ResponseError } from '../../types';
import { respondWithError } from '../../users/service';
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
