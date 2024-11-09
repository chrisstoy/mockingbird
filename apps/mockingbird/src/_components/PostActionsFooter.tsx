import { Post } from '@/_types/post';
import React from 'react';
import { CommentButton } from './CommentButton.client';

interface Props {
  post: Post;
}

export function PostActionsFooter({ post, ...rest }: Props) {
  return (
    <div className={`flex flex-row flex-auto gap-1 m-2`}>
      <div className="flex flex-row flex-auto justify-end">
        <CommentButton post={post}></CommentButton>
      </div>
    </div>
  );
}