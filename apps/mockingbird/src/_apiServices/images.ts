import { type UserId } from '@/_types/users';
import { fetchFromServer } from './fetchFromServer';
import { ImageSchema, type Image } from '@/_types/images';

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
    album?: string;
  }
): Promise<Image> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', metadata?.description || '');
  formData.append('album', metadata?.album || '');

  const response = await fetchFromServer(`/users/${userId}/images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    console.error(
      `Failed to uload image: ${response.status}: ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const newImage = ImageSchema.parse(rawData);
  return newImage;
}
