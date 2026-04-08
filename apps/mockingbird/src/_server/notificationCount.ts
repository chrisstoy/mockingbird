import { getFriendsForUser } from '@/_server/friendsService';
import { UserId } from '@/_types';

/**
 * Returns the total notification badge count for a user.
 * Add additional notification sources here as the app grows.
 */
export async function getNotificationCount(userId: UserId): Promise<number> {
  const { friendRequests } = await getFriendsForUser(userId);

  // Future sources: unread messages, mentions, etc.
  return friendRequests.length;
}
