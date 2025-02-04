import { FileSelectButton } from '@mockingbird/stoyponents';

interface Props {
  onImageSelected: (file: File) => void;
}

export function AddToPostOptions({ onImageSelected }: Props) {
  return (
    <div className="flex flex-none join border-2 border-b-2 pl-2">
      <div className="content-center pr-2 join-item">Add...</div>
      <FileSelectButton
        className="join-item"
        tooltip="Add Image"
        onFileSelected={onImageSelected}
      ></FileSelectButton>
    </div>
  );
}
