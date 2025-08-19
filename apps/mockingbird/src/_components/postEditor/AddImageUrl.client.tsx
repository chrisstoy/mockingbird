'use client';
import { addExternalImage } from '@/_apiServices/images';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type ImageId } from '@/_types';
import { TrashIcon } from '@heroicons/react/20/solid';
import { useCallback, useMemo, useState } from 'react';

interface Props {
  onImageSelected: (imageId: ImageId | undefined) => void;
}

export function AddImageUrl({ onImageSelected }: Props) {
  const user = useSessionUser();

  const [imageUrl, setImageUrl] = useState<string>('');

  const validImageUrl = useMemo(() => {
    try {
      new URL(imageUrl);
      return true;
    } catch {
      return false;
    }
  }, [imageUrl]);

  const handleAddImageUrl = useCallback(
    async (imageUrl: string | undefined) => {
      if (!imageUrl || !user?.id) {
        return;
      }
      try {
        const { id } = await addExternalImage(user.id, imageUrl, {
          description: 'External image',
        });
        onImageSelected(id);
      } catch (error) {
        console.error(error);
      }
    },
    [user?.id, onImageSelected]
  );

  return (
    <div className="card flex flex-col h-full">
      <div className="card-title mx-4 mt-4">Add Image URL</div>
      <div className="card-body">
        <div className="join">
          <input
            type="text"
            placeholder="Image URL"
            className="input input-bordered w-full join-item"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          ></input>
          <button
            className="btn join-item"
            onClick={() => setImageUrl('')}
            title="Clear"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
        <div>
          {validImageUrl && (
            <img
              src={imageUrl}
              alt="Image"
              className="w-full max-h-96 object-contain"
            />
          )}
        </div>
      </div>
      <div className="card-actions m-1 justify-end">
        <button
          className="btn btn-secondary btn-outline"
          onClick={() => onImageSelected(undefined)}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary btn-outline"
          onClick={() => handleAddImageUrl(imageUrl)}
        >
          Select Image
        </button>
      </div>
    </div>
  );
}
