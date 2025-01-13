import { prisma } from '@/_server/db';
import { PostId, PostSchema } from '@/_types/post';
import { UserId } from '@/_types/users';
import { z } from 'zod';

export async function createPost(
  posterId: UserId,
  content: string,
  responseToPostId?: PostId
) {
  const rawData = await prisma.post.create({
    data: {
      content,
      posterId,
      responseToPostId,
    },
  });

  const post = PostSchema.parse(rawData);
  return post;
}

export async function getPostWithId(postId: PostId) {
  const rawData = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  if (!rawData) {
    return undefined;
  }

  const post = PostSchema.parse(rawData);
  return post;
}

export async function doesPostExist(postId: PostId) {
  const rawData = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  return rawData !== null;
}

export async function getCommentsForPost(postId: PostId, limit?: number) {
  const rawData = await prisma.post.findMany({
    where: {
      responseToPostId: postId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  const comments = z.array(PostSchema).parse(rawData);
  return comments;
}

export async function getNumberOfCommentsForPost(postId: PostId) {
  const rawData = await prisma.post.count({
    where: {
      responseToPostId: postId,
    },
  });

  const numberOfComments = z.number().parse(rawData);
  return numberOfComments;
}

export async function deletePost(postId: PostId) {
  const result = await prisma.$transaction([
    // delete comments to this Post
    prisma.post.deleteMany({
      where: {
        responseToPostId: postId,
      },
    }),

    // delete Post
    prisma.post.delete({
      where: {
        id: postId,
      },
    }),
  ]);
  return result;
}
