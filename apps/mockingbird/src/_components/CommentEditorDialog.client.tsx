'use client';
import { getEditorApiKey } from '@/_server/getEditorApiKey';
import { getUser } from '@/_services/users';
import { Post } from '@/_types/post';
import {
  DialogActions,
  DialogButton,
  DialogHeader,
} from '@mockingbird/stoyponents';
import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useRef, useState } from 'react';
import { PostView } from './PostView';

const initOptions = {
  plugins: [],
  menubar: false,
  toolbar: false,
  statusbar: false,
};

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
  const editorRef = useRef<Editor>(null);

  const [apiKey, setApiKey] = useState<string>();
  const [posterInfo, setPosterInfo] = useState<{
    userName: string;
    imageSrc: string;
  }>();
  useEffect(() => {
    (async () => {
      const apiKey = await getEditorApiKey();
      setApiKey(apiKey);

      const poster = await getUser(originalPost.posterId);
      setPosterInfo({
        userName: poster?.name ?? 'Unknown',
        imageSrc: poster?.image ?? '/generic-user-icon.jpg',
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
    const content =
      editorRef.current?.editor?.getContent({ format: 'text' }) ?? '';
    onSubmitPost(content.trim());
  }

  return (
    <dialog
      ref={dialogRef}
      className="bg-transparent bg-base-100 open:animate-fade-in open:backdrop:animate-fade-in"
    >
      {apiKey && (
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
          <Editor
            ref={editorRef}
            apiKey={apiKey}
            init={initOptions}
            initialValue={''}
          />

          <DialogActions
            onClosed={() => {
              // do nothing
            }}
          >
            <DialogButton title="Post" onClick={handleSubmitPost} />
          </DialogActions>
        </div>
      )}
    </dialog>
  );
}
