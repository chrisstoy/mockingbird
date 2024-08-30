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
    console.error(
      `Failed to create post: ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}
