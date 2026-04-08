'use client';
import { addExternalImage } from '@/_apiServices/images';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type ImageId } from '@/_types';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useCallback, useMemo, useState } from 'react';

interface Props {
  onImageSelected: (imageId: ImageId | undefined) => void;
}

export function AddImageUrl({ onImageSelected }: Props) {
  const user = useSessionUser();
  const [imageUrl, setImageUrl] = useState('');

  const validImageUrl = useMemo(() => {
    try { new URL(imageUrl); return true; } catch { return false; }
  }, [imageUrl]);

  const handleAddImageUrl = useCallback(async (url: string | undefined) => {
    if (!url || !user?.id) return;
    try {
      const { id } = await addExternalImage(user.id, url, { description: 'External image' });
      onImageSelected(id);
    } catch (error) {
      console.error(error);
    }
  }, [user, onImageSelected]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-base-content/40">
          Add image from URL
        </p>
      </div>

      <div className="flex-auto px-4 py-3 flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            className="input input-bordered input-sm flex-1 text-sm"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => setImageUrl('')}
              aria-label="Clear"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {validImageUrl && (
          <div className="rounded-xl overflow-hidden border border-base-200 bg-base-200">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full max-h-64 object-contain"
            />
          </div>
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
          disabled={!validImageUrl}
          onClick={() => handleAddImageUrl(imageUrl)}
        >
          Add Image
        </button>
      </div>
    </div>
  );
}
