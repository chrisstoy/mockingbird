'use client';
import {
  GlobeAltIcon,
  PhotoIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/solid';
import { FileSelectButton } from '@mockingbird/stoyponents';

interface Props {
  disableImageSelection?: boolean;
  onImageSelected: (file: File) => void;
  onPickImage: () => void;
  onAddImageURL: () => void;
}

export function AddToPostOptions({
  onImageSelected,
  onPickImage,
  onAddImageURL,
  disableImageSelection,
}: Props) {
  return (
    <div className="flex flex-none join border-2 border-b-2 pl-2">
      <div className="content-center pr-2 join-item">Add...</div>
      <FileSelectButton
        className="join-item"
        tooltip="Upload Image"
        accept="image/*"
        onFileSelected={onImageSelected}
        disabled={disableImageSelection}
      >
        <PhotoIcon></PhotoIcon>
      </FileSelectButton>
      <button
        className="join-item btn btn-ghost btn-primary"
        disabled={disableImageSelection}
        onClick={() => onPickImage()}
      >
        <span className="w-6 h-6 tooltip" data-tip="Select Image">
          <SquaresPlusIcon></SquaresPlusIcon>
        </span>
      </button>
      <button
        className="join-item btn btn-ghost btn-primary"
        disabled={disableImageSelection}
        onClick={() => onAddImageURL()}
      >
        <span className="w-6 h-6 tooltip" data-tip="Add External Image">
          <GlobeAltIcon></GlobeAltIcon>
        </span>
      </button>
    </div>
  );
}
