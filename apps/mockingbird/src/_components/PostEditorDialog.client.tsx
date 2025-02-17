'use client';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { Post } from '@/_types/post';
import {
  DialogActions,
  DialogBody,
  DialogButton,
  DialogHeader,
  EditorAPI,
  EditorDelta,
  TextEditor,
} from '@mockingbird/stoyponents';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AddToPostOptions } from './AddToPostOptions.client';
import { ImageView } from './ImageView';

type Props = {
  onSubmitPost: ({
    content,
    imageFile,
  }: {
    content: string;
    imageFile?: File;
  }) => void;
  onClosed: () => void;
  originalPost?: Post;
};

export function PostEditorDialog({
  onSubmitPost,
  onClosed,
  originalPost,
}: Props) {
  const user = useSessionUser();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const editorApi = useRef<EditorAPI>(null);

  const [newContent, setNewContent] = useState<EditorDelta | undefined>(
    undefined
  );
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  useEffect(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    setImageUrl(imageFile ? URL.createObjectURL(imageFile) : undefined);

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageFile]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  const handleSubmitPost = useCallback(async () => {
    if (!user) {
      return;
    }

    // upload the image and get reference to it
    // let imageId: ImageId | undefined;
    // if (imageFile) {
    //   const { id } = await uploadImage(user.id, imageFile);
    //   imageId = id;
    // }
    // if (imageUrl) {
    //   URL.revokeObjectURL(imageUrl);
    // }

    const content = JSON.stringify(newContent);
    onSubmitPost({ content, imageFile });
  }, [user, imageFile, newContent]);

  const handleImageUpload = useCallback((file: File) => {
    setImageFile(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(undefined);
    setImageUrl(undefined);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-2xl h-full md:h-[90%] bg-transparent backdrop:backdrop-brightness-50"
    >
      <div className="flex flex-col h-full">
        <DialogHeader
          title={'Create a Post'}
          onClosed={onClosed}
        ></DialogHeader>
        <DialogBody>
          <div className="h-full flex flex-col">
            <div className="h-[1px] flex flex-col flex-auto overflow-scroll">
              <TextEditor
                ref={editorApi}
                initialContent={originalPost?.content}
                onChangeDelta={setNewContent}
              ></TextEditor>
              <ImageView
                imageUrl={imageUrl}
                onRemoveImage={handleRemoveImage}
              ></ImageView>
            </div>
            {/* <AddToPostOptions
              onImageSelected={handleImageUpload}
              disableImageSelection={imageFile !== null}
            ></AddToPostOptions> */}
          </div>
        </DialogBody>
        <DialogActions
          onClosed={() => {
            // do nothing
          }}
        >
          <DialogButton
            disabled={!newContent && !imageFile}
            onClick={handleSubmitPost}
          >
            Post
          </DialogButton>
        </DialogActions>
      </div>
    </dialog>
  );
}
