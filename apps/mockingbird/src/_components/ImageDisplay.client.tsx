/* eslint-disable @next/next/no-img-element */
'use client';
import { getImage } from '@/_apiServices/images';
import { Image, ImageId } from '@/_types/images';
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
    <div className={`flex flex-col content-center`}>
      {missingImage ? (
        <img
          src={MISSING_IMAGE_URL}
          alt="Missing Image"
          className="max-w-[50%] m-auto"
        />
      ) : image ? (
        <img
          src={image.imageUrl}
          alt={image.description}
          className="max-w-[50%] m-auto"
          onError={(event) => {
            event.currentTarget.onerror = null;
            setMissingImage(true);
          }}
        />
      ) : (
        <div className="skeleton flex flex-col max-w-[50%] m-auto items-center">
          <PhotoIcon className=" opacity-25 w-[30%]"></PhotoIcon>
        </div>
      )}
    </div>
  );
}
