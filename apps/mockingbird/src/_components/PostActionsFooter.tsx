import { Post } from '@/_types';
import { CommentButton } from './CommentButton.client';

interface Props {
  post: Post;
}

export function PostActionsFooter({ post, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={`flex flex-row flex-auto gap-1 m-2 pt-2 border-t-[1px] border-solid border-neutral-content`}
    >
      <div className="flex flex-row flex-auto justify-end">
        <CommentButton post={post}></CommentButton>
      </div>
    </div>
  );
}
