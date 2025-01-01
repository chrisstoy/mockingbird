'use client';

import { commentOnPost } from '@/_apiServices/post';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { Post } from '@/_types/post';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CommentEditorDialog } from './CommentEditorDialog.client';

type Props = {
  post: Post;
};

export function CommentButton({ post }: Props) {
  const router = useRouter();
  const user = useSessionUser();
  const [showEditor, setShowEditor] = useState(false);

  if (!user) {
    router.push('/auth/signin');
  }

  async function handleCommentOnPost(content: string) {
    setShowEditor(false);

    if (!user || content.length === 0) {
      return;
    }

    const result = await commentOnPost(user.id, post.id, content);
    console.log(`Commented on a post with content: ${JSON.stringify(result)}`);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-xs" onClick={() => setShowEditor(true)}>
        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
        Comment
      </button>
      {showEditor && (
        <CommentEditorDialog
          originalPost={post}
          onSubmitPost={handleCommentOnPost}
          onClosed={() => setShowEditor(false)}
        ></CommentEditorDialog>
      )}
    </>
  );
}
