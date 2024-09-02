import { Post } from '@/_types/post';
import { API_URL } from '@/../env.mjs';

export async function createPost(
  userId: string,
  content: string
): Promise<Post> {
  const response = await fetch(`${API_URL}/feed`, {
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
