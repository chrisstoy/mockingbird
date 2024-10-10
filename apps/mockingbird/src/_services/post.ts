import { Post } from '@/_types/post';
import { apiUrlFor } from './api';

export async function createPost(
  userId: string,
  content: string,
  responseToPostId?: string
): Promise<Post> {
  const response = await fetch(await apiUrlFor(`/posts`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      posterId: userId,
      content,
      responseToPostId,
    }),
  });

  if (!response.ok) {
    console.error(
      `Failed to create post: ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export async function getPostWithId(postId: string) {
  try {
    const response = await fetch(await apiUrlFor(`/posts/${postId}`));
    const post = (await response.json()) as Post;
    return post;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
