import { prisma } from '@/_server/db';
import { FeedSource, PostSchema, UserId } from '@/_types';
import { z } from 'zod';
import { getAcceptedFriendsForUser } from './friendsService';

const PUBLIC_FEED_PAGE_SIZE = 50;

export interface FeedOptions {
  userId: UserId;
  feedSource: FeedSource;
  cursor?: string;
}

export async function getFeed({ userId, feedSource, cursor }: FeedOptions) {
  switch (feedSource) {
    case 'public':
      return getPublicFeed(cursor);
    case 'private':
      return getPrivateFeedForUser(userId);
    default:
      throw new Error(`Unknown feed source: ${feedSource}`);
  }
}

/**
 * Return the current Feed of Posts for a user.
 *  A user's feed consists of all top-level posts by the user as well as all top-level
 *  posts by the user's friends.
 */
async function getPrivateFeedForUser(userId: UserId) {
  const userIdsForFeed = await getAcceptedFriendsForUser(userId);
  userIdsForFeed.push(userId);

  const rawData = await prisma.post.findMany({
    where: {
      posterId: { in: userIdsForFeed as unknown as string[] },
      responseToPostId: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const posts = z.array(PostSchema).parse(rawData);
  return posts;
}

/**
 * Return the public Feed of Posts for a user.
 *  A user's public feed consists of all top-level public posts by all users.
 */
async function getPublicFeed(cursor?: string) {
  const rawData = await prisma.post.findMany({
    where: {
      audience: 'PUBLIC',
      responseToPostId: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: PUBLIC_FEED_PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const posts = z.array(PostSchema).parse(rawData);
  return posts;
}
