'use client';
import { commentOnPost } from '@/_apiServices/post';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { Post } from '@/_types/post';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import { SubmitPostOptions, useDialogManager } from './DialogManager.client';
import { uploadImage } from '@/_apiServices/images';

type Props = {
  post: Post;
};

export function CommentButton({ post }: Props) {
  const dialogManager = useDialogManager();
  const router = useRouter();
  const user = useSessionUser();

  async function handleCommentOnPost(content: SubmitPostOptions) {
    dialogManager.hidePostEditor();

    if (!user || (!content.message?.length && !content.image)) {
      return;
    }

    const uploadNewImage = async (imageFile: File) => {
      const image = await uploadImage(user.id, imageFile);
      return image.id;
    };

    const imageId =
      content.image instanceof File
        ? await uploadNewImage(content.image)
        : content.image;

    const result = await commentOnPost(
      user.id,
      post.id,
      content.message ?? '',
      imageId
    );
    console.log(`Commented on a post with content: ${JSON.stringify(result)}`);
    router.refresh();
  }

  function handleShowEditor() {
    dialogManager.showPostEditor({
      originalPost: post,
      onSubmitPost: handleCommentOnPost,
    });
  }

  return (
    <button className="btn btn-xs" onClick={handleShowEditor}>
      <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
      Comment
    </button>
  );
}
