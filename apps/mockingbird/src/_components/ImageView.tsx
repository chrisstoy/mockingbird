import { XMarkIcon } from '@heroicons/react/20/solid';

interface Props {
  imageUrl: string | undefined | null;
  onRemoveImage: () => void;
}

export function ImageView({ imageUrl, onRemoveImage }: Props) {
  return (
    <div>
      {imageUrl && (
        <div className="flex flex-col flex-none border-2 border-b-2 radius-2 pl-2 m-1 p-1">
          <button
            className="btn btn-circle btn-sm"
            onClick={() => onRemoveImage()}
          >
            <XMarkIcon />
          </button>
          <div className="flex-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="New Image"
              className="max-w-[50%] m-auto"
            ></img>
          </div>
        </div>
      )}
    </div>
  );
}
