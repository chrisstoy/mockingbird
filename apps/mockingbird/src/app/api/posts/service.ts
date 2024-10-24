import { prisma } from '@/_server/db';

export async function createPost(
  posterId: string,
  content: string,
  responseToPostId?: string
) {
  const post = await prisma.post.create({
    data: {
      content,
      posterId,
      responseToPostId,
    },
  });
  return post;
}

export async function doesPostExist(postId: string) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  return !!post;
}

export async function getCommentsForPost(postId: string, limit?: number) {
  const posts = await prisma.post.findMany({
    where: {
      responseToPostId: postId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return posts;
}
