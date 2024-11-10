import { signIn } from '@/app/auth';
import { apiUrlFor } from './api';

export async function getFeedForUser(userId: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${userId}/feed`), {
      next: { tags: ['feed'] },
    });

    if (!response.ok) {
      if (response.status === 401) {
        signIn();
      }

      console.error(
        `Failed to fetch feed: ${response.status}: ${response.statusText}`
      );
      return [];
    }

    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error(error);
    return [];
  }
}
