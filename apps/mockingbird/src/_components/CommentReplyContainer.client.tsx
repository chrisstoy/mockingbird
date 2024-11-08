'use client';
import { commentOnPost, getCommentsForPost } from '@/_services/post';
import { Post, sortByCreatedAtDesc } from '@/_types/post';
import { TextEditor } from '@mockingbird/stoyponents';
import { useSession } from 'next-auth/react';
import { Suspense, useEffect, useState } from 'react';
import { CommentReplyList } from './CommentReplyList.client';
import { ReplyFooter } from './ReplyFooter.client';

type Props = {
  originalComment: Post;
  originalPosterId: string;
  hideReplies: boolean;
};
export function CommentReplyContainer({
  originalComment,
  originalPosterId,
  hideReplies = false,
}: Props) {
  const { data: session } = useSession();
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [replyContent, setReplyContent] = useState<string>('');

  const [replies, setReplies] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      const replies = (await getCommentsForPost(originalComment.id)) ?? [];
      const sortedReplies = replies.sort(sortByCreatedAtDesc);
      setReplies(sortedReplies);
    })();
  }, [originalComment.id]);

  const submitReply = async (canceled?: boolean) => {
    setShowReplyEditor(false);

    if (
      canceled ||
      replyContent.length === 0 ||
      session?.user?.id === undefined
    ) {
      return;
    }

    const result = await commentOnPost(
      session?.user?.id,
      originalComment.id,
      replyContent
    );
    setReplies([...replies, result]);
  };

  return (
    <>
      <div className="pr-2 pb-2">
        <ReplyFooter
          onReplyToComment={() => setShowReplyEditor(true)}
        ></ReplyFooter>
      </div>
      {!hideReplies && (
        <Suspense
          fallback={
            <div className="text-secondary-content m-2 text-center">
              Loading...
            </div>
          }
        >
          <CommentReplyList
            replies={replies}
            originalPosterId={originalPosterId}
            onReplyToComment={() => setShowReplyEditor(true)}
          ></CommentReplyList>
        </Suspense>
      )}
      {showReplyEditor && (
        <>
          <div className="divider my-0"></div>
          <TextEditor
            placeholder={`Replying to ${originalComment.posterId}`}
            onChange={setReplyContent}
            onSubmit={submitReply}
          ></TextEditor>
        </>
      )}
    </>
  );
}
