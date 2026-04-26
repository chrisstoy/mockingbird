'use client';

import { createPost } from '@/_apiServices/post';
import { GroupId, UserId } from '@/_types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { userId: UserId; groupId: GroupId };

export function GroupPostComposer({ userId, groupId }: Props) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await createPost(userId, content, 'GROUP', undefined, groupId);
      setContent('');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-4 flex flex-col gap-3">
      <textarea
        className="textarea textarea-ghost resize-none w-full text-base placeholder:text-base-content/40 focus:outline-none"
        placeholder="Share something with the flock..."
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={submitting || !content.trim()}
        >
          {submitting ? <span className="loading loading-spinner loading-xs" /> : 'Post'}
        </button>
      </div>
    </form>
  );
}
