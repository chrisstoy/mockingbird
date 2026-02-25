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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-center">
      <div className="rounded-full bg-base-200 p-5">
        <PhotoIcon className="w-10 h-10 opacity-30" />
      </div>
      <div>
        <p className="font-semibold text-base-content">No images yet</p>
        <p className="text-sm text-base-content/50 mt-1">
          Upload an image first, then come back to select it.
        </p>
      </div>
    </div>
  );
}

export function SelectExistingImage({ onImageSelected }: Props) {
  const user = useSessionUser();

  const [selectedImage, setSelectedImage] = useState<ImageId>();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      // load all image thumbnails for the user
      const images = await getImagesForUser(user.id);
      setImages(images);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="card flex flex-col h-full">
      <div className="card-title mx-4 mt-4 mb-2">Select existing image</div>
      <div className="card-body flex-auto h-[1px] overflow-y-scroll">
        {loading ? (
          <div className="grid-cols-3 grid gap-2">
            <SkeletonPhoto />
            <SkeletonPhoto />
            <SkeletonPhoto />
          </div>
        ) : images.length > 0 ? (
          <div className="grid-cols-3 grid gap-2">
            {images.map((image) => (
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
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
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
