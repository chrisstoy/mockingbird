'use client';
import { commentOnPost, getCommentsForPost } from '@/_apiServices/post';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type Post } from '@/_types';
import { type EditorDelta, TextEditor } from '@mockingbird/stoyponents';
import { Suspense, useEffect, useState } from 'react';
import { CommentReplyList } from './CommentReplyList.client';
import { ReplyFooter } from './ReplyFooter.client';
import { SkeletonCommentReply } from './SkeletonCommentReply';

const sortByCreatedAtDesc = (a: { createdAt: Date }, b: { createdAt: Date }) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

type Props = {
  originalComment: Post;
  replyingToName: string;
  originalPosterId: string;
  hideReplies: boolean;
};
export function CommentReplyContainer({
  originalComment,
  replyingToName,
  originalPosterId,
  hideReplies = false,
}: Props) {
  const user = useSessionUser();
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [replyContent, setReplyContent] = useState<EditorDelta>();

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

    if (canceled || !user?.id || !replyContent?.length()) {
      return;
    }

    const newComment = await commentOnPost(
      user?.id,
      originalComment.id,
      JSON.stringify(replyContent)
    );
    setReplies([...replies, newComment]);
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
              <ul className="list-none max-w-2xl">
                <li className="mt-0 mb-3 ml-6 mr-2" key="1">
                  <SkeletonCommentReply></SkeletonCommentReply>
                </li>
                <li className="mt-0 mb-3 ml-6 mr-2" key="1">
                  <SkeletonCommentReply></SkeletonCommentReply>
                </li>
              </ul>
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
            placeholder={`Replying to ${replyingToName}`}
            onChangeDelta={setReplyContent}
            onSubmit={submitReply}
          ></TextEditor>
        </>
      )}
    </>
  );
}
