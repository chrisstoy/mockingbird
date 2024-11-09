import { z } from 'zod';

const createPostDataShape = {
  posterId: z.string(),
  content: z.string().min(1),
};

export const createPostDataSchema = z.object(createPostDataShape);
export type CreatePost = z.infer<typeof createPostDataSchema>;

export const createCommentDataSchema = createPostDataSchema.extend({
  responseToPostId: z.string().optional(),
});
export type CreateComment = z.infer<typeof createCommentDataSchema>;

export const postSchema = createPostDataSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  likeCount: z.number(),
  dislikeCount: z.number(),
});
export type Post = z.infer<typeof postSchema>;

export const sortByCreatedAtAsc = (
  a: { createdAt: Date },
  b: { createdAt: Date }
) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export const sortByCreatedAtDesc = (
  a: { createdAt: Date },
  b: { createdAt: Date }
) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
