import { z } from 'zod';

const createPostDataShape = {
  posterId: z.string(),
  responseToPostId: z.string().optional(),
  content: z.string().min(1),
};

export const createPostDataSchema = z.object(createPostDataShape);
export type CreatePost = z.infer<typeof createPostDataSchema>;

export const postSchema = createPostDataSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  likeCount: z.number(),
  dislikeCount: z.number(),
});
export type Post = z.infer<typeof postSchema>;
