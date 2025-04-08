'use client';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type ImageId } from '@/_types/images';
import {
  DialogActions,
  DialogBody,
  DialogButton,
  DialogHeader,
} from '@mockingbird/stoyponents';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  onImageSelected: ({ imageId }: { imageId: ImageId | undefined }) => void;
  onClosed: () => void;
};

export function SelectImageDialog({ onImageSelected, onClosed }: Props) {
  const user = useSessionUser();

  const dialogRef = useRef<HTMLDialogElement>(null);

  const [selectedImage, setSelectedImage] = useState<ImageId>();

  // if there is an original post, get the poster's info
  useEffect(() => {
    (async () => {
      // load all image thumbnails for the user
    })();
  }, []);

  // open the dialog and close it automatically
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  const handleImageSelected = useCallback(async () => {
    if (!user) {
      return;
    }

    onImageSelected({ imageId: selectedImage });
  }, [onImageSelected]);

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-2xl h-full md:h-[90%] bg-transparent backdrop:backdrop-brightness-50"
    >
      <div className="flex flex-col h-full">
        <DialogHeader
          title="Select an image to add to Post"
          onClosed={onClosed}
        ></DialogHeader>
        <DialogBody>
          <div className="h-full flex flex-col">
            {/* Display grid of all images associated with the user account */}
            <div className="h-[1px] flex flex-col flex-auto overflow-scroll"></div>
          </div>
        </DialogBody>
        <DialogActions
          onClosed={() => {
            // do nothing
          }}
        >
          <DialogButton disabled={!selectedImage} onClick={handleImageSelected}>
            Ok
          </DialogButton>
        </DialogActions>
      </div>
    </dialog>
  );
}
