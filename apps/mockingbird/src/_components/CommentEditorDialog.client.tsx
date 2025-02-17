'use client';
import { uploadImage } from '@/_apiServices/images';
import { getUser } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { Post } from '@/_types/post';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
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
import { PostView } from './PostView';

type Props = {
  onSubmitPost: (content: string) => void;
  onClosed: () => void;
  originalPost: Post;
};

export function CommentEditorDialog({
  onSubmitPost,
  onClosed,
  originalPost,
}: Props) {
  const user = useSessionUser();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const editorApi = useRef<EditorAPI>(null);

  const [posterInfo, setPosterInfo] = useState<{
    userName: string;
    imageSrc: string;
  }>({
    userName: 'Unknown',
    imageSrc: GENERIC_USER_IMAGE_URL,
  });
  const [newContent, setNewContent] = useState<EditorDelta>();

  useEffect(() => {
    (async () => {
      const poster = await getUser(originalPost.posterId);
      setPosterInfo({
        userName: poster?.name ?? 'Unknown',
        imageSrc: poster?.image ?? GENERIC_USER_IMAGE_URL,
      });
    })();
  }, [originalPost]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

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

  function handleSubmitPost() {
    if (newContent) {
      const content = JSON.stringify(newContent);
      onSubmitPost(content);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-2xl h-full md:h-[90%] bg-transparent backdrop:backdrop-brightness-50"
    >
      {posterInfo && (
        <div className="flex flex-col h-full">
          <DialogHeader
            title={`${posterInfo.userName}'s Post`}
            onClosed={onClosed}
          ></DialogHeader>
          <DialogBody>
            <div className="h-full flex flex-col">
              <div className="h-[1px] flex flex-col flex-auto overflow-scroll">
                <PostView
                  imageSrc={posterInfo.imageSrc}
                  userName={posterInfo.userName}
                  content={originalPost.content}
                  createdAt={originalPost.createdAt}
                ></PostView>
                <TextEditor
                  ref={editorApi}
                  onChangeDelta={setNewContent}
                ></TextEditor>
              </div>
              {/* <AddToPostOptions
                onImageSelected={handleImageUpload}
              ></AddToPostOptions> */}
            </div>
          </DialogBody>
          <DialogActions
            onClosed={() => {
              // do nothing
            }}
          >
            <DialogButton disabled={!newContent} onClick={handleSubmitPost}>
              Post
            </DialogButton>
          </DialogActions>
        </div>
      )}
    </dialog>
  );
}
