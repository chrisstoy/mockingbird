import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:feed',
});

type Params = {
  userId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const userId = context.params.userId;

  logger.info(`Getting feed for userId: ${userId}`);

  // the user's feed consists of all top-level posts by the user
  // as well as all top-level posts by the user's friends.
  const friends = await prisma.friends.findMany({
    where: {
      userId,
      accepted: true,
    },
    select: {
      friendId: true,
    },
  });

  const friendIds = [userId, ...friends.map(({ friendId }) => friendId)];

  const posts = await prisma.post.findMany({
    where: {
      posterId: { in: friendIds },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return NextResponse.json(posts, { status: 200 });
}

const postSchema = z.object({
  posterId: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(request: Request, context: { params: Params }) {
  const rawBody = await request.json();
  const userId = context.params.userId;

  try {
    const { posterId, content } = postSchema.parse(rawBody);
    if (userId !== posterId) {
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
