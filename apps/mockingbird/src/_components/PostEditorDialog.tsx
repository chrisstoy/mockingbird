'use client';
import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useRef } from 'react';
import {
  DialogActions,
  DialogHeader,
  DialogButton,
} from '@mockingbird/stoyponents';
import { Post } from '@/_types/post';

const initOptions = {
  plugins: [],
  menubar: false,
  toolbar: false,
  statusbar: false,
};

type Props = {
  apiKey: string;
  onSubmitPost: (content: string) => void;
  onClosed: () => void;
  originalPost?: Post;
};

export function PostEditorDialog({
  apiKey,
  onSubmitPost,
  onClosed,
  originalPost,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editorRef = useRef<Editor>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  function handleSubmitPost() {
    const content =
      editorRef.current?.editor?.getContent({ format: 'text' }) ?? '';
    onSubmitPost(content.trim());
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
        <Editor
          ref={editorRef}
          apiKey={apiKey}
          init={initOptions}
          initialValue={originalPost?.content ?? ''}
        />

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
