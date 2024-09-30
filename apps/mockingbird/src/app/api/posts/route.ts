import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { z } from 'zod';
import { auth } from '@/app/auth';

const logger = baseLogger.child({
  service: 'api:posts',
});

const postSchema = z.object({
  posterId: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.error('User not logged in');
      return NextResponse.json(
        { statusText: 'User not logged in' },
        { status: 401 }
      );
    }

    const rawBody = await request.json();
    const { posterId, content } = postSchema.parse(rawBody);

    if (session?.user?.id !== posterId) {
      throw new Error('posterId and userId must match');
    }

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
