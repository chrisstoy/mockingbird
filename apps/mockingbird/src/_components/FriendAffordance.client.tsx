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

  if (status === 'none') {
    return (
      <button
        onClick={async () => {
          if (!user?.id) return;
          await requestFriend(user.id, authorId);
          setStatus('pending');
        }}
        className="text-xs text-primary hover:underline font-medium shrink-0"
      >
        Add Friend
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button
        onClick={() => router.push('/friends')}
        className="text-xs text-base-content/40 hover:underline font-medium shrink-0"
      >
        Pending...
      </button>
    );
  }

  return null;
}
