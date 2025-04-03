'use client';
import { FileSelectButton } from '@mockingbird/stoyponents';
import { PhotoIcon } from '@heroicons/react/24/solid';

interface Props {
  onImageSelected: (file: File) => void;
  disableImageSelection?: boolean;
}

export function AddToPostOptions({
  onImageSelected,
  disableImageSelection,
}: Props) {
  return (
    <div className="flex flex-none join border-2 border-b-2 pl-2">
      <div className="content-center pr-2 join-item">Add...</div>
      <FileSelectButton
        className="join-item"
        tooltip="Add Image"
        accept="image/*"
        onFileSelected={onImageSelected}
        disabled={disableImageSelection}
      >
        <PhotoIcon></PhotoIcon>
      </FileSelectButton>
    </div>
  );
}
