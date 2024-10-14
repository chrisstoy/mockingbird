'use client';

import { commentOnPost } from '@/_services/post';
import { Post } from '@/_types/post';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CommentEditorDialog } from './CommentEditorDialog.client';

type Props = {
  post: Post;
};

export function CommentButton({ post }: Props) {
  const [showEditor, setShowEditor] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleCommentOnPost(content: string) {
    setShowEditor(false);

    if (!session?.user?.id) {
      return;
    }

    const result = await commentOnPost(session.user.id, post.id, content);
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
