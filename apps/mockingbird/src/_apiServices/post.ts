import { Audience, ImageId, Post, PostId, PostSchema, UserId } from '@/_types';
import { z } from 'zod';
import { fetchFromServer } from './fetchFromServer';

export async function createPost(
  userId: UserId,
  content: string,
  audience: Audience,
  imageId?: ImageId
): Promise<Post> {
  const response = await fetchFromServer(`/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      posterId: userId,
      audience,
      content,
      imageId,
    }),
  });

  if (!response.ok) {
    console.error(
      `Failed to create post: ${response.status}: ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const newPost = PostSchema.parse(rawData);
  return newPost;
}

export async function getPostWithId(postId: PostId): Promise<Post | undefined> {
  try {
    const response = await fetchFromServer(`/posts/${postId}`);
    const rawData = await response.json();
    const post = PostSchema.parse(rawData);
    return post;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function getCommentsForPost(
  postId: PostId,
  limit?: number
): Promise<Post[] | undefined> {
  try {
    const response = await fetchFromServer(
      `/posts/${postId}/comments${limit ? `?limit=${limit}` : ``}`
    );
    const rawData = await response.json();
    const posts = z.array(PostSchema).parse(rawData);
    return posts;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function getFirstCommentForPost(
  postId: PostId
): Promise<Post | undefined> {
  const comments = await getCommentsForPost(postId, 1);
  return comments?.[0];
}

export async function commentOnPost(
  userId: UserId,
  postId: PostId,
  content: string,
  imageId?: ImageId
): Promise<Post> {
  const response = await fetchFromServer(`/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      posterId: userId,
      content,
      imageId,
    }),
  });

  if (!response.ok) {
    console.error(
      `Failed to comment on post: ${response.status}: ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const newPost = PostSchema.parse(rawData);
  return newPost;
}

export async function deletePost(postId: PostId) {
  const result = await fetchFromServer(`/posts/${postId}`, {
    method: 'DELETE',
  });

  return result.status === 204;
}
