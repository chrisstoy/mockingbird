'use client';
import { getImagesForUser } from '@/_apiServices/images';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type Image, type ImageId } from '@/_types';
import { CheckIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

interface Props {
  onImageSelected: (imageId: ImageId | undefined) => void;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton aspect-square rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center">
        <PhotoIcon className="w-6 h-6 text-base-content/30" />
      </div>
      <div>
        <p className="font-semibold text-sm text-base-content">No images yet</p>
        <p className="text-xs text-base-content/50 mt-1">
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
      const imgs = await getImagesForUser(user.id);
      setImages(imgs);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-base-content/40">
          Select from library
        </p>
      </div>

      <div className="flex-auto h-px overflow-y-auto">
        {loading ? (
          <SkeletonGrid />
        ) : images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 p-4">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImage(image.id)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  image.id === selectedImage
                    ? 'border-primary scale-95'
                    : 'border-transparent hover:border-base-300'
                }`}
              >
                <img
                  src={image.thumbnailUrl}
                  alt={image.description ?? 'user image'}
                  className="w-full h-full object-cover"
                />
                {image.id === selectedImage && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-base-200">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onImageSelected(undefined)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!selectedImage}
          onClick={() => onImageSelected(selectedImage)}
        >
          Select Image
        </button>
      </div>
    </div>
  );
}
