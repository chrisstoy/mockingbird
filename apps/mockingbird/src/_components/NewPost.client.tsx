'use client';
import { uploadImage } from '@/_apiServices/images';
import { createPost } from '@/_apiServices/post';
import { type SessionUser } from '@/_types/users';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useDialogManager } from './DialogManager.client';
import { type SubmitPostParams } from './PostEditorDialog.client';

type Props = {
  user: SessionUser | undefined;
};
export function NewPost({ user }: Props) {
  const dialogManager = useDialogManager();
  const router = useRouter();

  const firstName = useMemo(
    () => user?.name?.split(' ')[0] ?? 'Anonymous',
    [user]
  );

  const userImage = useMemo(
    () => user?.image ?? GENERIC_USER_IMAGE_URL,
    [user]
  );

  async function handleCreatePost({ content, image }: SubmitPostParams) {
    dialogManager.hidePostEditor();

    if (!user || (!content?.length && !image)) {
      return;
    }

    const uploadNewImage = async (imageFile: File) => {
      const image = await uploadImage(user.id, imageFile);
      return image.id;
    };

    const imageId = image instanceof File ? await uploadNewImage(image) : image;

    const result = await createPost(user.id, content, imageId);
    console.log(`Create a post with content: ${JSON.stringify(result)}`);
    router.refresh();
  }

  function handleShowEditor() {
    dialogManager.showPostEditor({
      onSubmitPost: handleCreatePost,
    });
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
    </div>
  );
}
