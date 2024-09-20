import baseLogger from '@/_server/logger';
import { signIn } from '@/app/auth';
import { apiUrlFor } from './api';

const logger = baseLogger.child({
  service: 'feed',
});

export async function getFeedForUser(userId: string) {
  try {
    const response = await fetch(await apiUrlFor(`/feed/${userId}`), {
      next: { tags: ['feed'] },
    });

    if (!response.ok) {
      if (response.status === 401) {
        signIn();
      }

      logger.error(
        `Failed to fetch feed: ${response.status}: ${response.statusText}`
      );
      return [];
    }

    const posts = await response.json();
    return posts;
  } catch (error) {
    logger.error(error);
    return [];
  }
}
