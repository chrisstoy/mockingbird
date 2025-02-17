import { z } from 'zod';
import { createDatabaseIdSchema } from './type-utilities';
import { UserIdSchema } from './users';

export type ImageId = string & { __brand: 'ImageId' };
export const ImageIdSchema = createDatabaseIdSchema<ImageId>();

export type AlbumId = string & { __brand: 'AlbumId' };
export const AlbumIdSchema = createDatabaseIdSchema<AlbumId>();

export const CreateImageDataSchema = z.object({
  ownerId: UserIdSchema,
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  description: z.string().default(''),
  albumId: AlbumIdSchema.nullish(),
});
export type CreateImage = z.infer<typeof CreateImageDataSchema>;

export const ImageSchema = CreateImageDataSchema.extend({
  id: ImageIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Image = z.infer<typeof ImageSchema>;

export type ImageMetadata = {
  filename: string;
  width: string;
  height: string;
  format: string;
  size: string;
};

export const CreateAlbumSchema = z.object({
  ownerId: UserIdSchema,
  name: z.string().default(''),
});
export type CreateAlbum = z.infer<typeof CreateAlbumSchema>;

export const AlbumSchema = CreateAlbumSchema.extend({
  id: AlbumIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  images: z.array(ImageSchema),
});
export type ImagAlbum = z.infer<typeof AlbumSchema>;
