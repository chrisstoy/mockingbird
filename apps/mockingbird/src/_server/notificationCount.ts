import { getUnreadNotificationCount } from '@/_server/notificationService';
import { UserId } from '@/_types';

export async function getNotificationCount(userId: UserId): Promise<number> {
  return getUnreadNotificationCount(userId);
}
