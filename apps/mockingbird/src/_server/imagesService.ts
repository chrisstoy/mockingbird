import { env } from '@/../env';
import {
  CreateImageDataSchema,
  ImageId,
  ImageMetadata,
  ImageSchema,
} from '@/_types/images';
import { UserId } from '@/_types/users';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { prisma } from './db';
import baseLogger from './logger';

const logger = baseLogger.child({
  service: 'images:service',
});

let s3Client: S3Client;
const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME;

try {
  const config: S3ClientConfig = {
    region: 'auto',
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  };
  logger.info(`Creating S3 client`, config);
  s3Client = new S3Client(config);
} catch (error) {
  logger.error(error);
  throw error;
}

/**
 * List top-level directories in the remote storage bucket.
 * @returns list of directory names
 */
export async function enumerateRemoteDirectories() {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Delimiter: '/',
  });

  try {
    const response = await s3Client.send(command);
    return response.CommonPrefixes?.map((prefix) => prefix.Prefix) || [];
  } catch (error) {
    logger.error('Error listing directories:', error);
    throw error;
  }
}

/**
 * Return list of images for the specified user
 * @param userId User to fetch images for
 * @param options optional object specifying maxFiles and/or continuationToken used to page results
 * @returns object with list of images and continuation token if more images exists
 */
export async function enumerateRemoteFilesForUser(
  userId: UserId,
  options?: {
    maxFiles?: number;
    continuationToken?: string;
  }
) {
  const params: ListObjectsV2CommandInput = {
    Bucket: bucketName,
    Prefix: `${userId}/`,
    MaxKeys: options?.maxFiles,
    ContinuationToken: options?.continuationToken,
  };

  const command = new ListObjectsV2Command(params);

  try {
    const response = await s3Client.send(command);
    return {
      files:
        response.Contents?.map((obj) => ({
          key: obj.Key,
          lastModified: obj.LastModified,
          size: obj.Size,
        })) || [],
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
    };
  } catch (error) {
    logger.error(error);
    throw new Error(`Failed to list images for User: ${error}`);
  }
}

/**
 * Retrieves an image record by its ID from the database.
 *
 * @param imageId - The ID of the image to retrieve.
 * @returns The image object if found, otherwise undefined.
 */
export async function getImage(imageId: ImageId) {
  const rawImage = await prisma.image.findUnique({
    where: { id: imageId },
  });
  return rawImage ? ImageSchema.parse(rawImage) : undefined;
}

/**
 * Stores an image for a user by uploading the original and a thumbnail
 * to the remote storage, and creates a record in the database.
 *
 * @param userId - The ID of the user who owns the image.
 * @param file - The image file to be stored.
 * @param description - Optional description of the image.
 * @param album - Optional album name to associate with the image.
 * @returns The stored image record.
 */
export async function storeImageForUser(
  userId: UserId,
  file: File,
  description?: string,
  album?: string
) {
  const getMetadataForImage = async (image: sharp.Sharp, name: string) => {
    const { width, height, format, size, ...rest } = await image.metadata();
    return {
      filename: name,
      width: `${width}`,
      height: `${height}`,
      format: `${format}`,
      size: `${size}`,
    };
  };

  const imageKeyToUrl = (key: string) => `${env.IMAGES_BASE_URL}/${key}`;

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name;

  const originalImage = sharp(originalBuffer);
  const originalMetadata = await getMetadataForImage(originalImage, filename);

  const thumbnailImage = originalImage
    .resize(120, 120, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .withMetadata();
  const thumbnailMetadata = await getMetadataForImage(
    thumbnailImage,
    `thumbnail-${filename}`
  );
  const thumbnailBuffer = await thumbnailImage.toBuffer();
  thumbnailMetadata.size = `${thumbnailBuffer.byteLength}`;
  thumbnailMetadata.width = '120';
  thumbnailMetadata.height = '120';

  const [originalImageResult, thumbnailImageResult] = await Promise.all([
    uploadImageForUser(userId, originalBuffer, originalMetadata),
    uploadImageForUser(userId, thumbnailBuffer, thumbnailMetadata),
  ]);

  const imageUrl = imageKeyToUrl(originalImageResult.key);
  const thumbnailUrl = imageKeyToUrl(thumbnailImageResult.key);

  // create a record in the database
  const imageData = CreateImageDataSchema.parse({
    ownerId: userId,
    imageUrl,
    thumbnailUrl,
    description: description ?? '',
    album: album ?? '',
  });

  const rawData = await prisma.image.create({
    data: imageData,
  });

  const image = ImageSchema.parse(rawData);
  return image;
}

async function uploadImageForUser(
  userId: UserId,
  source: Buffer,
  metadata: ImageMetadata
) {
  const key = `${userId}/${randomUUID()}.${metadata.format}`;

  logger.info(`Storing image in Bucket: ${bucketName}, key: ${key}`, metadata);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: source,
    ContentType: `image/${metadata.format}`,
    Metadata: metadata,
  });

  const result = await s3Client.send(command);
  return { key, ...result };
}

/**
 * Deletes an image and its associated thumbnail for the specified user.
 * @throws Error if the image does not exist or does not belong to the user
 * @throws Error if deletion fails
 * @returns the deleted image on success
 */
export async function deleteImageForUser(userId: UserId, imageId: ImageId) {
  try {
    const rawImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!rawImage) {
      throw new Error(`Image with id: ${imageId} not found`);
    }
    const image = ImageSchema.parse(rawImage);

    if (image.ownerId !== userId) {
      throw new Error(
        `Image with id: ${imageId} does not belong to user: ${userId}`
      );
    }

    const deleteImage = async (imageUrl: string) => {
      const key = imageUrl.replace(env.IMAGES_BASE_URL, '');

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const result = await s3Client.send(command);

      if (result.$metadata.httpStatusCode !== 204) {
        logger.warn(`Failed to delete image: ${imageUrl}`, result.$metadata);
      }
      return result;
    };

    logger.info(
      `Deleting image: ${image.imageUrl} and thumbnail: ${image.thumbnailUrl}`
    );

    const [original, thumbnail] = await Promise.all([
      deleteImage(image.imageUrl),
      deleteImage(image.thumbnailUrl),
    ]);

    const rawData = await prisma.image.delete({
      where: { id: imageId },
    });

    const deletedImage = ImageSchema.parse(rawData);
    logger.info(`DELETE Image: ${JSON.stringify(deletedImage)}`);
    return deletedImage;
  } catch (error) {
    logger.error(`DELETE Image Error: ${error}`);
    throw error;
  }
}
