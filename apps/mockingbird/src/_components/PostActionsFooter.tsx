import { Post } from '@/_types/post';
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { CommentButton } from './CommentButton.client';

interface Props {
  post: Post;
}

export function PostActionsFooter({ post, ...rest }: Props) {
  return (
    <div className={`flex flex-row flex-auto gap-1 m-2`}>
      <button className="btn btn-xs">
        <HandThumbUpIcon className="h-4 w-4" />
        Like
      </button>
      <button className="btn btn-xs">
        <HandThumbDownIcon className="h-4 w-4" />
        Dislike
      </button>
      <div className="flex flex-row flex-auto justify-end">
        <CommentButton post={post}></CommentButton>
      </div>
    </div>
  );
}
