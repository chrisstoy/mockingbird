import { PostSchema, UserId } from '@/_types';
import { fetchFromServer } from './fetchFromServer';
import { z } from 'zod';

export async function getFeedForUser(userId: UserId) {
  try {
    const response = await fetchFromServer(`/users/${userId}/feed`, {
      next: { tags: ['feed'] },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthorized: User needs to sign in');
        // Client-side redirect to signin should be handled by middleware
      }

      console.error(
        `Failed to fetch feed: ${response.status}: ${response.statusText}`
      );
      return [];
    }

    const rawData = await response.json();
    const posts = z.array(PostSchema).parse(rawData);
    return posts;
  } catch (error) {
    console.error(error);
    return [];
  }
}
