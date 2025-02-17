import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { ImageId } from '@/_types/images';
import { CreatePostDataSchema, PostId, PostSchema } from '@/_types/post';
import { UserId } from '@/_types/users';
import { errorToString } from '@/_utils/errorToString';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'posts:service',
});

export async function createPost(
  posterId: UserId,
  content: string,
  responseToPostId?: PostId | null
) {
  try {
    const data = {
      posterId,
      content,
      responseToPostId,
    };

    const rawData = await prisma.post.create({
      data,
    });

    const post = PostSchema.parse(rawData);
    return post;
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`createPost: ${errorToString(error)}`);
  }
}

export async function getPostWithId(postId: PostId) {
  try {
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
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`getPostWithId: ${errorToString(error)}`);
  }
}

export async function doesPostExist(postId: PostId) {
  try {
    const rawData = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });
    return rawData !== null;
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`doesPostExist: ${errorToString(error)}`);
  }
}

export async function getCommentsForPost(postId: PostId, limit?: number) {
  try {
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
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`getCommentsForPost: ${errorToString(error)}`);
  }
}

export async function getNumberOfCommentsForPost(postId: PostId) {
  try {
    const rawData = await prisma.post.count({
      where: {
        responseToPostId: postId,
      },
    });

    const numberOfComments = z.number().parse(rawData);
    return numberOfComments;
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`getNumberOfCommentsForPost: ${errorToString(error)}`);
  }
}

export async function deletePost(postId: PostId) {
  try {
    const result = await prisma.$transaction([
      // This will also delete comments and replies associated with the post
      prisma.post.delete({
        where: {
          id: postId,
        },
      }),
    ]);
    return result;
  } catch (error) {
    logger.error(errorToString(error));
    throw new Error(`deletePost: ${errorToString(error)}`);
  }
}
