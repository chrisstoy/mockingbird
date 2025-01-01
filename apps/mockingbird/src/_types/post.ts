import { z } from 'zod';
import { createDatabaseIdSchema } from './type-utilities';
import { UserIdSchema } from './users';

export const CreatePostDataSchema = z.object({
  posterId: UserIdSchema,
  content: z.string().min(1),
});
export type CreatePost = z.infer<typeof CreatePostDataSchema>;

export type PostId = string & { __brand: 'PostId' };
export const PostIdSchema = createDatabaseIdSchema<PostId>();

export const PostSchema = CreatePostDataSchema.extend({
  id: PostIdSchema,
  responseToPostId: PostIdSchema.optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  likeCount: z.number(),
  dislikeCount: z.number(),
});
export type Post = z.infer<typeof PostSchema>;
