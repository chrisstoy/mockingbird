import {
  ImageSchema,
  type AlbumId,
  type Image,
  type ImageId,
} from '@/_types/images';
import { type UserId } from '@/_types/users';
import { z } from 'zod';
import { fetchFromServer } from './fetchFromServer';

/**
 * Upload the image file and associate it with the specified user
 *
 * @param userId owner of the image
 * @param file Image file to upload
 * @param metadata extra data to associate with the image, like description and album
 * @returns Image record
 */
export async function uploadImage(
  userId: UserId,
  file: File,
  metadata?: {
    description?: string;
    albumId?: AlbumId;
  }
): Promise<Image> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', metadata?.description || '');
  formData.append('albumId', metadata?.albumId || '');

  const response = await fetchFromServer(`/users/${userId}/images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    console.error(
      `Failed to upload image: ${response.status}: ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const newImage = ImageSchema.parse(rawData);
  return newImage;
}

/**
 * Fetches an image by its ID from the server.
 *
 * @param imageId - The ID of the image to retrieve.
 * @returns The image object if found, otherwise logs an error.
 */
export async function getImage(imageId: ImageId) {
  const response = await fetchFromServer(`/images/${imageId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    console.error(
      `Failed to find image: ${response.status}: ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const image = ImageSchema.parse(rawData);
  return image;
}

/**
 * Fetches a list of images for a user by their ID.
 *
 * @param userId - The ID of the user to retrieve images for.
 * @returns A list of image objects if found, otherwise logs an error.
 */
export async function getImagesForUser(userId: UserId) {
  // TODO - support paging and albums since user may have a LOT of images.
  const response = await fetchFromServer(`/users/${userId}/images`, {
    method: 'GET',
  });

  if (!response.ok) {
    console.error(
      `Failed to find images for user ${userId}: ${response.status}: ${response.statusText}`
    );
    // TODO - better error handling!
    return [];
  }

  const rawData = await response.json();
  const images = z.array(ImageSchema).parse(rawData);
  return images;
}
