import { prisma } from '@/_server/db';
import { groupPostReactions } from '@/_server/reactionService';
import { FeedSource, PostSchema, UserId } from '@/_types';
import { getAcceptedFriendsForUser } from './friendsService';

const PUBLIC_FEED_PAGE_SIZE = 50;

type RawPostWithReactions = {
  reactions: Array<{ userId: string; reaction: string; user: { id: string; name: string; image: string | null } }>;
  [key: string]: unknown;
};

function parsePostsWithReactions(rawData: RawPostWithReactions[]) {
  return rawData.map((raw) => {
    const { reactions: rawReactions, ...postData } = raw;
    return PostSchema.parse({
      ...postData,
      reactions: groupPostReactions(rawReactions),
    });
  });
}

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
    orderBy: { createdAt: 'desc' },
    include: {
      reactions: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  const posts = parsePostsWithReactions(rawData);
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
    orderBy: { createdAt: 'desc' },
    take: PUBLIC_FEED_PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      reactions: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  const posts = parsePostsWithReactions(rawData);
  return posts;
}
