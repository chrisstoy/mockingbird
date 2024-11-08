import { Post } from '@/_types/post';
import { apiUrlFor } from './api';

export async function createPost(
  userId: string,
  content: string
): Promise<Post> {
  const response = await fetch(await apiUrlFor(`/posts`), {
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

export async function getCommentsForPost(postId: string, limit?: number) {
  try {
    const response = await fetch(
      await apiUrlFor(
        `/posts/${postId}/comments${limit ? `?limit=${limit}` : ``}`
      )
    );
    const posts = (await response.json()) as Post[];
    return posts;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function getFirstCommentForPost(postId: string) {
  const comments = await getCommentsForPost(postId, 1);
  return comments?.[0];
}

export async function commentOnPost(
  userId: string,
  postId: string,
  content: string
): Promise<Post> {
  const response = await fetch(await apiUrlFor(`/posts/${postId}/comments`), {
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
      `Failed to comment on post: ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export async function deletePost(postId: string) {
  const response = await fetch(await apiUrlFor(`/posts/${postId}`), {
    method: 'DELETE',
  });
  return response;
}
