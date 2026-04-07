'use client';
import { uploadImage } from '@/_apiServices/images';
import { createPost } from '@/_apiServices/post';
import { type SessionUser } from '@/_types';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useDialogManager } from './DialogManager.client';
import { type SubmitPostParams } from './postEditor/PostEditorDialog.client';

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

  async function handleCreatePost({
    audience,
    content,
    image,
  }: SubmitPostParams) {
    dialogManager.hidePostEditor();

    if (!user || (!content?.length && !image)) {
      return;
    }

    const uploadNewImage = async (imageFile: File) => {
      const img = await uploadImage(user.id, imageFile);
      return img.id;
    };

    const imageId = image instanceof File ? await uploadNewImage(image) : image;
    await createPost(user.id, content, audience, imageId);
    router.refresh();
  }

  function handleShowEditor() {
    dialogManager.showPostEditor({
      onSubmitPost: handleCreatePost,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-base-200 shadow-sm px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={userImage}
            alt="Profile Picture"
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        </div>
        <button
          onClick={handleShowEditor}
          className="flex-1 text-left bg-base-100 hover:bg-base-200 transition-colors rounded-full px-4 py-2.5 text-sm text-base-content/40"
        >
          {`What's on your mind, ${firstName}?`}
        </button>
        <button
          onClick={handleShowEditor}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center"
          aria-label="New post"
        >
          <PencilSquareIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
