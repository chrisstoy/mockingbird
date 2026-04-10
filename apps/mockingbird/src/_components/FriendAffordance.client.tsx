'use client';
import { requestFriend } from '@/_apiServices/friends';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { FriendStatus, UserId } from '@/_types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  authorId: UserId;
  initialStatus: FriendStatus;
}

export function FriendAffordance({ authorId, initialStatus }: Props) {
  const user = useSessionUser();
  const router = useRouter();
  const [status, setStatus] = useState<FriendStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === 'none') {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          if (!user?.id || loading) return;
          setLoading(true);
          setStatus('pending');
          const result = await requestFriend(user.id, authorId);
          if (result === undefined) {
            setStatus('none');
          }
          setLoading(false);
        }}
        className="text-xs text-primary hover:underline font-medium shrink-0 disabled:opacity-50"
      >
        Add Friend
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button
        type="button"
        onClick={() => router.push('/friends')}
        className="text-xs text-base-content/40 hover:underline font-medium shrink-0"
      >
        Pending...
      </button>
    );
  }

  return null;
}
