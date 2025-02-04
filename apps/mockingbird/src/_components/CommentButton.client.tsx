'use client';

import { commentOnPost } from '@/_apiServices/post';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { Post } from '@/_types/post';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import { useDialogManager } from './DialogManager.client';

type Props = {
  post: Post;
};

export function CommentButton({ post }: Props) {
  const dialogManager = useDialogManager();

  const router = useRouter();
  const user = useSessionUser();

  async function handleCommentOnPost(content: string) {
    dialogManager.hideCommentEditor();

    if (!user || content.length === 0) {
      return null;
    }

    const result = await commentOnPost(user.id, post.id, content);
    console.log(`Commented on a post with content: ${JSON.stringify(result)}`);
    router.refresh();
  }

  function handleShowEditor() {
    dialogManager.showCommentEditor({
      originalPost: post,
      onSubmitPost: handleCommentOnPost,
    });
  }

  return (
    <>
      <button className="btn btn-xs" onClick={handleShowEditor}>
        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
        Comment
      </button>
    </>
  );
}
