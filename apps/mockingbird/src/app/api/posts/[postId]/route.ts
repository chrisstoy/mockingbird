import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import logger from '@/_server/logger';
import { prisma } from '@/_server/db';
import { z } from 'zod';

type Params = {
  postId: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const postId = context.params.postId;

  logger.info(`Getting Post ${postId}`);

  // the user's feed consists of all top-level posts by the user
  // as well as all top-level posts by the user's friends.
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
    },
  });

  return NextResponse.json(post, { status: 200 });
}
