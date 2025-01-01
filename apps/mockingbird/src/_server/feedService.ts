import { prisma } from '@/_server/db';
import { PostSchema } from '@/_types/post';
import { UserId } from '@/_types/users';
import { z } from 'zod';
import { getAcceptedFriendsForUser } from './friendsService';

/**
 * Return the current Feed of Posts for a user.
 *  A user's feed consists of all top-level posts by the user as well as all top-level
 *  posts by the user's friends.
 */
export async function getFeedForUser(userId: UserId) {
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
