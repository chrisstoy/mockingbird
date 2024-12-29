import { z } from 'zod';
import { createDatabaseIdSchema } from './type-utilities';
import { UserIdSchema } from './users';

export const CreatePostDataSchema = z.object({
  posterId: UserIdSchema,
  content: z.string().min(1),
});
export type CreatePost = z.infer<typeof CreatePostDataSchema>;

export const CreateCommentDataSchema = CreatePostDataSchema.extend({
  responseToPostId: z.string().optional(),
});
export type CreateComment = z.infer<typeof CreateCommentDataSchema>;

export type PostId = string & { __brand: 'PostId' };
export const PostIdSchema = createDatabaseIdSchema<PostId>();

export const PostSchema = CreatePostDataSchema.extend({
  id: PostIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  likeCount: z.number(),
  dislikeCount: z.number(),
});
export type Post = z.infer<typeof PostSchema>;

export const sortByCreatedAtAsc = (
  a: { createdAt: Date },
  b: { createdAt: Date }
) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export const sortByCreatedAtDesc = (
  a: { createdAt: Date },
  b: { createdAt: Date }
) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
