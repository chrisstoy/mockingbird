import { Post } from '@/_types/post';

export async function createPost(
  userId: string,
  content: string
): Promise<Post> {
  const response = await fetch('http://localhost:3000/api/feed', {
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
    throw new Error('Failed to create post');
  }

  return response.json();
}
