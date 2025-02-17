import { z } from 'zod';
import { createDatabaseIdSchema } from './type-utilities';
import { UserIdSchema } from './users';
import { ImageIdSchema } from './images';

export type PostId = string & { __brand: 'PostId' };
export const PostIdSchema = createDatabaseIdSchema<PostId>();

export const CreatePostDataSchema = z.object({
  posterId: UserIdSchema,
  responseToPostId: PostIdSchema.nullish(),
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

/*
  TODO: Posts should consist of a block of Text plus an optional image, link, video, or other external
  reference.

  For ActivityPub, to add an image to a Note we would either add an `attachement` or `image`.  Need to
  further investigate.
*/
