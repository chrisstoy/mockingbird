import { prisma } from '@/_server/db';
import { UserId } from '@/_types/users';
import { getAcceptedFriendsForUser } from '../../service';

/**
 *  A user's feed consists of all top-level posts by the user as well as all top-level
 *  posts by the user's friends.
 */
export async function getFeedForUser(userId: UserId) {
  const userIdsForFeed = await getAcceptedFriendsForUser(userId);
  userIdsForFeed.push(userId);

  const posts = await prisma.post.findMany({
    where: {
      posterId: { in: userIdsForFeed as unknown as string[] },
      responseToPostId: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return posts;
}
