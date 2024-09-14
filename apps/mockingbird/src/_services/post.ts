import { Post } from '@/_types/post';
import { apiUrlFor } from './api';

export async function createPost(
  userId: string,
  content: string
): Promise<Post> {
  const response = await fetch(await apiUrlFor(`/feed/${userId}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      posterId: userId,
      content,
    }),
  });

  if (!response.ok) {
    console.error(
      `Failed to create post: ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}
