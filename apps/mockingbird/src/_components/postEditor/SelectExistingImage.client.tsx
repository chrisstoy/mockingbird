'use client';
import { getImagesForUser } from '@/_apiServices/images';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type Image, type ImageId } from '@/_types';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

interface Props {
  onImageSelected: (imageId: ImageId | undefined) => void;
}

function SkeletonPhoto() {
  return (
    <div className="skeleton flex flex-col m-auto items-center">
      <PhotoIcon className=" opacity-25 w-32 h-28"></PhotoIcon>
    </div>
  );
}

export function SelectExistingImage({ onImageSelected }: Props) {
  const user = useSessionUser();

  const [selectedImage, setSelectedImage] = useState<ImageId>();
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    if (!user) {
      setImages([]);
      return;
    }

    (async () => {
      // load all image thumbnails for the user
      const images = await getImagesForUser(user.id);
      setImages(images);
    })();
  }, [user]);

  return (
    <div className="card flex flex-col h-full">
      <div className="card-title mx-4 mt-4 mb-2">Select existing image</div>
      <div className="card-body flex-auto h-[1px] overflow-y-scroll">
        <div className="grid-cols-3 grid gap-2">
          {images.length > 0 ? (
            images.map((image) => (
              <div
                key={image.id}
                className={`p-2 flex justify-center border-2 rounded-lg bg-base-100 ${
                  image.id === selectedImage ? 'border-green-400' : ''
                }`}
                onClick={() => setSelectedImage(image.id)}
              >
                <img
                  src={image.thumbnailUrl}
                  alt={image.description ?? 'user image'}
                ></img>
              </div>
            ))
          ) : (
            <>
              <SkeletonPhoto></SkeletonPhoto>
              <SkeletonPhoto></SkeletonPhoto>
              <SkeletonPhoto></SkeletonPhoto>
            </>
          )}
        </div>
      </div>
      <div className="card-actions m-1 mt-2 justify-end">
        <button
          className="btn btn-secondary btn-outline"
          onClick={() => onImageSelected(undefined)}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary btn-outline"
          onClick={() => onImageSelected(selectedImage)}
        >
          Select Image
        </button>
      </div>
    </div>
  );
}
