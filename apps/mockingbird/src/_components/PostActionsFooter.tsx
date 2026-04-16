// apps/mockingbird/src/_components/PostActionsFooter.tsx
import { Post, UserId } from '@/_types';
import { CommentButton } from './CommentButton.client';
import { ReactionsBar } from './ReactionsBar.client';

interface Props {
  post: Post;
  numberOfComments?: number;
  currentUserId?: UserId;
}

export function PostActionsFooter({
  post,
  numberOfComments = 0,
  currentUserId,
}: Props) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2 border-t border-base-200">
      <ReactionsBar
        postId={post.id}
        initialReactions={post.reactions ?? []}
        currentUserId={currentUserId}
      />
      <div className="flex items-center gap-4">
        <CommentButton post={post} numberOfComments={numberOfComments} />
      </div>
    </div>
  );
}
