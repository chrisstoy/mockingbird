import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { Post } from '@prisma/client';
import { prisma } from '@/_services/db';

const feed = new Array<Post>();

export async function GET(request: NextRequest) {
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return NextResponse.json(posts, { status: 200 });
}

export async function POST(request: Request) {
  // TODO - validate body using zod
  const body = await request.json();

  const post = await prisma.post.create({
    data: {
      posterId: body.posterId,
      content: body.content,
    },
  });

  feed.push(post);

  revalidateTag('feed');

  return NextResponse.json({ postId: post.id }, { status: 201 });
}
