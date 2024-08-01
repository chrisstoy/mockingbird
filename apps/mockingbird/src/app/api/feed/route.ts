import { Post } from '@/_services/post';
import { randomUUID } from 'crypto';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const feed: Post[] = [
  {
    id: randomUUID(),
    createdAt: new Date(),
    posterId: 'test-user-1',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    likeCount: 0,
    dislikeCount: 0,
  },
  {
    id: randomUUID(),
    createdAt: new Date(),
    posterId: 'test-user-2',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    likeCount: 0,
    dislikeCount: 0,
  },
];

export async function GET(request: NextRequest) {
  return NextResponse.json(feed, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();

  // TODO - validate body using zod

  const post = {
    id: randomUUID(),
    createdAt: new Date(),
    posterId: body.posterId,
    content: body.content,
    likeCount: 0,
    dislikeCount: 0,
  };
  feed.push(post);

  revalidateTag('feed');

  return NextResponse.json({ postId: post.id }, { status: 201 });
}
