'use client';

import { createPost } from '@/_services/post';
import { Post } from '@/_types/post';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CommentEditorDialog } from './CommentEditorDialog.client';

type Props = {
  post: Post;
};

export function CommentButton({ post }: Props) {
  const [showEditor, setShowEditor] = useState(false);
  const { data: session } = useSession();

  async function handleCommentOnPost(content: string) {
    setShowEditor(false);

    if (!session?.user?.id) {
      return;
    }

    const result = await createPost(session.user.id, content, post.id);
    console.log(`Commented on a post with content: ${JSON.stringify(result)}`);
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
