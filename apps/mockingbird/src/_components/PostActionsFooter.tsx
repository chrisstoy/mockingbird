import { Post } from '@/_types';
import { CommentButton } from './CommentButton.client';

interface Props {
  post: Post;
  numberOfComments?: number;
}

export function PostActionsFooter({ post, numberOfComments = 0 }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-t border-base-200">
      <CommentButton post={post} numberOfComments={numberOfComments} />
    </div>
  );
}
