'use client';
import { useCallback, useRef } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  tooltip?: string;
  onFileSelected: (file: File) => void;
  accept?: string; // type of file to accept in requester
  disabled?: boolean;
  buttonClassName?: string;
}

/**
 * A button that allows the user to select a file.
 */
export function FileSelectButton({
  onFileSelected,
  tooltip,
  accept,
  disabled,
  children,
  className,
  buttonClassName,
  ...rest
}: Props) {
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
    <div {...rest} className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={tooltip ?? 'Select File'}
        title={tooltip ?? 'Select File'}
        className={buttonClassName ?? 'btn btn-ghost btn-primary'}
        onClick={() => fileInputRef.current?.click()}
      >
        {children}
      </button>
    </div>
  );
}
