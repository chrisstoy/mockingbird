'use client';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { useCallback, useRef } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  tooltip?: string;
  onFileSelected: (file: File) => void;
}

/**
 * A button that allows the user to select a file.
 */
export function FileSelectButton({ onFileSelected, tooltip, ...rest }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  return (
    <div {...rest}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        className="btn btn-ghost btn-primary"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="w-6 h-6 tooltip" data-tip={tooltip ?? 'Upload Image'}>
          <PhotoIcon></PhotoIcon>
        </span>
      </button>
    </div>
  );
}
