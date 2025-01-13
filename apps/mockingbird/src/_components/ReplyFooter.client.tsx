'use client';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid';

interface Props {
  onReplyToComment: () => void;
}

export function ReplyFooter({ onReplyToComment }: Props) {
  return (
    <div className="flex flex-row flex-auto justify-end ml-2 pt-2 border-t-[1px] border-solid border-neutral-content">
      <button className="btn btn-xs" onClick={onReplyToComment}>
        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
        Reply
      </button>
    </div>
  );
}
