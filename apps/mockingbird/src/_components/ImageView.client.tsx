'use client';
import { getImage } from '@/_apiServices/images';
import { type ImageId } from '@/_types';
import { MISSING_IMAGE_URL } from '@/constants';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';

interface Props {
  imageUrl?: string;
  imageId?: ImageId;
  onRemoveImage: () => void;
}

export function ImageView({ imageUrl, imageId, onRemoveImage }: Props) {
  const [urlForImage, setUrlForImage] = useState<string>();

  useEffect(() => {
    setUrlForImage(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (!imageId) {
      setUrlForImage(undefined);
      return;
    }
    (async () => {
      const image = await getImage(imageId);
      if (image) {
        setUrlForImage(image.imageUrl);
      }
    })();
  }, [imageId]);

  return (
    <div>
      {urlForImage && (
        <div className="flex flex-col flex-none border-2 border-b-2 radius-2 pl-2 m-1 p-1">
          <button
            className="btn btn-circle btn-sm"
            onClick={() => onRemoveImage()}
          >
            <XMarkIcon />
          </button>
          <div className="flex-auto">
            <img
              src={urlForImage}
              alt="New Image"
              className="max-w-[50%] m-auto"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = MISSING_IMAGE_URL;
              }}
            ></img>
          </div>
        </div>
      )}
    </div>
  );
}
