'use client';
import { getImage } from '@/_apiServices/images';
import { Image, ImageId } from '@/_types';
import { MISSING_IMAGE_URL } from '@/constants';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

interface Props {
  imageId: ImageId | undefined | null;
}

export function ImageDisplay({ imageId }: Props) {
  const [image, setImage] = useState<Image>();
  const [missingImage, setMissingImage] = useState(false);

  useEffect(() => {
    (async () => {
      if (imageId) {
        try {
          const image = await getImage(imageId);
          setImage(image);
        } catch (err) {
          console.error(`Failed to fetch image: ${imageId}`, err);
          setMissingImage(true);
        }
      }
    })();
  }, [imageId]);

  if (!imageId) {
    return null;
  }

  return (
    <div className="mt-3 mb-1 rounded-xl overflow-hidden">
      {missingImage ? (
        <img
          src={MISSING_IMAGE_URL}
          alt="Missing Image"
          className="w-full max-h-96 object-cover"
        />
      ) : image ? (
        <img
          src={image.imageUrl}
          alt={image.description}
          className="w-full max-h-96 object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            setMissingImage(true);
          }}
        />
      ) : (
        <div className="skeleton w-full h-48 flex items-center justify-center">
          <PhotoIcon className="w-12 h-12 opacity-25" />
        </div>
      )}
    </div>
  );
}
