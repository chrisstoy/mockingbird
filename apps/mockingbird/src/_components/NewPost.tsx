'use client';
import Image from 'next/image';
import { PostEditorDialog } from './PostEditorDialog';
import { useState } from 'react';
import { ConfirmSignOutDialog } from '@mockingbird/stoyponents';

type Props = {
  firstName: string;
  userImageSrc: string;
  apiKey: string | undefined;
};
export function NewPost({ firstName, userImageSrc, apiKey }: Props) {
  const [showEditor, setShowEditor] = useState(false);

  function handleCreatePost(content: string) {
    setShowEditor(false);

    console.log(`Create a post with content: ${content}`);
  }

  function handleShowEditor() {
    setShowEditor(true);
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-row">
          <div>
            <div className="avatar">
              <div className="rounded-full">
                <Image
                  src={userImageSrc}
                  alt="Profile Picture"
                  width={42}
                  height={42}
                ></Image>
              </div>
            </div>
          </div>
          <div className="w-full ml-2">
            <button
              className="btn btn-block no-animation content-center justify-start text-primary"
              onClick={handleShowEditor}
            >
              {`What's going on, ${firstName}?`}
            </button>
          </div>
        </div>
      </div>
      {showEditor && apiKey && (
        <PostEditorDialog
          apiKey={apiKey}
          onSubmitPost={handleCreatePost}
          onClosed={() => setShowEditor(false)}
        ></PostEditorDialog>
      )}
    </div>
  );
}
