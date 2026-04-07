'use client';
import { uploadImage } from '@/_apiServices/images';
import { commentOnPost } from '@/_apiServices/post';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { Post } from '@/_types';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useDialogManager } from './DialogManager.client';
import { SubmitPostParams } from './postEditor/PostEditorDialog.client';

type Props = {
  post: Post;
  numberOfComments?: number;
};

export function CommentButton({ post, numberOfComments = 0 }: Props) {
  const dialogManager = useDialogManager();
  const router = useRouter();
  const user = useSessionUser();

  async function handleCommentOnPost({ content, image }: SubmitPostParams) {
    dialogManager.hidePostEditor();

    if (!user || (!content?.length && !image)) {
      return;
    }

    const uploadNewImage = async (imageFile: File) => {
      const image = await uploadImage(user.id, imageFile);
      return image.id;
    };

    const imageId = image instanceof File ? await uploadNewImage(image) : image;

    await commentOnPost(user.id, post.id, content ?? '', imageId);
    router.refresh();
  }

  function handleShowEditor() {
    dialogManager.showPostEditor({
      originalPost: post,
      onSubmitPost: handleCommentOnPost,
    });
  }

  return (
    <button
      onClick={handleShowEditor}
      className="flex items-center gap-1.5 text-base-content/50 hover:text-primary transition-colors text-sm font-medium py-1 px-2 rounded-lg hover:bg-primary/5"
    >
      <ChatBubbleLeftIcon className="w-4 h-4" />
      {numberOfComments > 0 && (
        <span>{numberOfComments}</span>
      )}
    </button>
  );
}
