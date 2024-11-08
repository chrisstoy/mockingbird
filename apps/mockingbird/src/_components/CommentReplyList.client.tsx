'use client';
import { Post } from '@/_types/post';
import { CommentReply } from './CommentReply.client';

type Props = {
  replies: Post[];
  originalPosterId: string;
  onReplyToComment: () => void;
};
export function CommentReplyList({
  replies,
  originalPosterId,
  onReplyToComment,
}: Props) {
  return (
    <ul className="list-none max-w-2xl">
      {replies.map((post) => (
        <li className="mt-0 mb-3 ml-6 mr-2" key={post.id}>
          <CommentReply
            comment={post}
            originalPosterId={originalPosterId}
            onReplyToComment={onReplyToComment}
          ></CommentReply>
        </li>
      ))}
    </ul>
  );
}
