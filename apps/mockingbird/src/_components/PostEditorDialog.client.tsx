'use client';
import { Post } from '@/_types/post';
import {
  DialogActions,
  DialogButton,
  DialogHeader,
  TextEditor,
} from '@mockingbird/stoyponents';
import { useEffect, useRef, useState } from 'react';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [newContent, setNewContent] = useState<string>('');

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
          title={'Create a Post'}
          onClosed={onClosed}
        ></DialogHeader>
        <TextEditor
          initialContent={originalPost?.content}
          onChange={setNewContent}
        ></TextEditor>

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
