import { z } from 'zod';
import { AudienceSchema } from './audience';
import { ImageIdSchema } from './images';
import { createDatabaseIdSchema } from './type-utilities';
import { UserIdSchema } from './users';

export type PostId = string & { __brand: 'PostId' };
export const PostIdSchema = createDatabaseIdSchema<PostId>();

export const CreatePostDataSchema = z.object({
  posterId: UserIdSchema,
  responseToPostId: PostIdSchema.nullish(),
  audience: AudienceSchema,
  content: z.string().min(1, 'No Content'),
});
export type CreatePost = z.infer<typeof CreatePostDataSchema>;

export const PostSchema = CreatePostDataSchema.extend({
  id: PostIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  imageId: ImageIdSchema.nullish(),
  likeCount: z.number(),
  dislikeCount: z.number(),
});
export type Post = z.infer<typeof PostSchema>;
