'use client';
import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import {
  DialogActions,
  DialogButton,
  DialogHeader,
  TextEditor,
} from '@mockingbird/stoyponents';
import { useEffect, useRef, useState } from 'react';
import { PostView } from './PostView';
import { GENERIC_USER_IMAGE_URL } from '@/constants';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [posterInfo, setPosterInfo] = useState<{
    userName: string;
    imageSrc: string;
  }>();
  const [newContent, setNewContent] = useState<string>('');

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

  function handleSubmitPost() {
    onSubmitPost(newContent);
  }

  return (
    <dialog
      ref={dialogRef}
      className="bg-transparent bg-base-100 open:animate-fade-in open:backdrop:animate-fade-in"
    >
      <div className="card card-bordered shadow-xl bg-base-100 w-96">
        <DialogHeader
          title={`${posterInfo?.userName}'s Post`}
          onClosed={onClosed}
        ></DialogHeader>
        <PostView
          imageSrc={posterInfo?.imageSrc ?? ''}
          userName={posterInfo?.userName ?? ''}
          content={originalPost.content}
          createdAt={originalPost.createdAt}
        ></PostView>
        <TextEditor onChange={setNewContent}></TextEditor>

        <DialogActions
          onClosed={() => {
            // do nothing
          }}
        >
          <DialogButton title="Post" onClick={handleSubmitPost} />
        </DialogActions>
      </div>
    </dialog>
  );
}
