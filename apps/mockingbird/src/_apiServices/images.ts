import { type UserId } from '@/_types/users';
import { fetchFromServer } from './fetchFromServer';
import { ImageId, ImageSchema, type Image } from '@/_types/images';
import { AlbumId } from '@/_types/images';

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
