import { prisma } from '@/_server/db';
import { getAcceptedFriendsForUser } from '../../service';

/**
 *  A user's feed consists of all top-level posts by the user as well as all top-level
 *  posts by the user's friends.
 */
export async function getFeedForUser(userId: string) {
  const userIdsForFeed = await getAcceptedFriendsForUser(userId);
  userIdsForFeed.push(userId);

  const posts = await prisma.post.findMany({
    where: {
      posterId: { in: userIdsForFeed },
      responseToPostId: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return posts;
}
