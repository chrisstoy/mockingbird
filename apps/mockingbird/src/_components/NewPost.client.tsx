'use client';
import { createPost } from '@/_apiServices/post';
import { SessionUser } from '@/_types/users';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PostEditorDialog } from './PostEditorDialog.client';

type Props = {
  user: SessionUser | undefined;
};
export function NewPost({ user }: Props) {
  const [showEditor, setShowEditor] = useState(false);

  const router = useRouter();

  const firstName = useMemo(
    () => user?.name?.split(' ')[0] ?? 'Anonymous',
    [user]
  );

  const userImage = useMemo(
    () => user?.image ?? GENERIC_USER_IMAGE_URL,
    [user]
  );

  async function handleCreatePost(content: string) {
    setShowEditor(false);

    if (!user || !user.id || content.length === 0) {
      return;
    }

    const result = await createPost(user.id, content);
    console.log(`Create a post with content: ${JSON.stringify(result)}`);
    router.refresh();
  }

  function handleShowEditor() {
    setShowEditor(true);
  }

  return (
    <div className="card bg-base-100 shadow-xl w-full">
      <div className="card-body">
        <div className="flex flex-row">
          <div className="avatar">
            <div className="rounded-full">
              <Image
                src={userImage}
                alt="Profile Picture"
                width={42}
                height={42}
              ></Image>
            </div>
          </div>
          <div className="flex flex-grow flex-col ml-2 justify-center">
            <button
              className="btn btn-block no-animation content-center justify-start text-primary"
              onClick={handleShowEditor}
            >
              {`What's going on, ${firstName}?`}
            </button>
          </div>
        </div>
      </div>
      {showEditor && (
        <PostEditorDialog
          onSubmitPost={handleCreatePost}
          onClosed={() => setShowEditor(false)}
        ></PostEditorDialog>
      )}
    </div>
  );
}
