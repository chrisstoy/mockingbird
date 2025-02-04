'use client';
import { uploadImage } from '@/_apiServices/images';
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

type Props = {
  onSubmitPost: (content: string) => void;
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

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  function handleSubmitPost() {
    const content = JSON.stringify(newContent);
    onSubmitPost(content);
  }

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editorApi.current || !user) {
        return;
      }

      const { imageUrl } = await uploadImage(user.id, file);
      editorApi.current.insertImage(imageUrl);
    },
    [editorApi]
  );

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
            </div>
            <AddToPostOptions
              onImageSelected={handleImageUpload}
            ></AddToPostOptions>
          </div>
        </DialogBody>
        <DialogActions
          onClosed={() => {
            // do nothing
          }}
        >
          <DialogButton
            disabled={!newContent}
            title="Post"
            onClick={handleSubmitPost}
          />
        </DialogActions>
      </div>
    </dialog>
  );
}
