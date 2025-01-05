import { signIn } from '@/app/auth';
import { fetchFromServer } from './fetchFromServer';
import { UserId } from '@/_types/users';
import { PostSchema } from '@/_types/post';
import { z } from 'zod';

export async function getFeedForUser(userId: UserId) {
  try {
    const response = await fetchFromServer(`/users/${userId}/feed`, {
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

    const rawData = await response.json();
    const posts = z.array(PostSchema).parse(rawData);
    return posts;
  } catch (error) {
    console.error(error);
    return [];
  }
}
