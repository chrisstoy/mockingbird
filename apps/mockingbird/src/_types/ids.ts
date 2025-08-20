import { createDatabaseIdSchema } from './type-utilities';

export type ImageId = string & { __brand: 'ImageId' };
export const ImageIdSchema = createDatabaseIdSchema<ImageId>();

export type AlbumId = string & { __brand: 'AlbumId' };
export const AlbumIdSchema = createDatabaseIdSchema<AlbumId>();

export type PostId = string & { __brand: 'PostId' };
export const PostIdSchema = createDatabaseIdSchema<PostId>();

export type UserId = string & { __brand: 'UserId' };
export const UserIdSchema = createDatabaseIdSchema<UserId>();
