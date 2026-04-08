'use client';
import {
  GlobeAltIcon,
  PhotoIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';
import { FileSelectButton } from '@mockingbird/stoyponents';

interface Props {
  disableImageSelection?: boolean;
  onImageSelected: (file: File) => void;
  onPickImage: () => void;
  onAddImageURL: () => void;
}

function ToolbarButton({
  onClick,
  disabled,
  tooltip,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={tooltip}
      title={tooltip}
      className="p-2 rounded-xl text-base-content/50 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      <span className="w-5 h-5 block">{children}</span>
    </button>
  );
}

export function AddToPostOptions({
  onImageSelected,
  onPickImage,
  onAddImageURL,
  disableImageSelection,
}: Props) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-xs font-semibold text-base-content/30 uppercase tracking-widest mr-1">
        Add
      </span>
      <FileSelectButton
        tooltip="Upload Image"
        accept="image/*"
        onFileSelected={onImageSelected}
        disabled={disableImageSelection}
        buttonClassName="p-2 rounded-xl text-base-content/50 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <PhotoIcon className="w-5 h-5" />
      </FileSelectButton>
      <ToolbarButton
        onClick={onPickImage}
        disabled={disableImageSelection}
        tooltip="Select from library"
      >
        <SquaresPlusIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={onAddImageURL}
        disabled={disableImageSelection}
        tooltip="Add external image"
      >
        <GlobeAltIcon />
      </ToolbarButton>
    </div>
  );
}
