import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:posts',
});

const postSchema = z.object({
  posterId: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const { posterId, content } = postSchema.parse(rawBody);

    const post = await prisma.post.create({
      data: {
        posterId,
        content,
      },
    });

    revalidateTag('feed');

    logger.info(`Created a new post for userId: ${posterId}`);

    return NextResponse.json({ postId: post.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = JSON.stringify(error.issues);

      logger.error(`Failed to create new post. Invalid data - ${issues}`);
      return NextResponse.json(
        { statusText: `Bad Request: ${issues}` },
        { status: 400 }
      );
    }

    logger.error(`Failed to create new post. Error - ${error})}`);
    return NextResponse.json(
      { statusText: `Bad Request: ${error}` },
      { status: 400 }
    );
  }
}
