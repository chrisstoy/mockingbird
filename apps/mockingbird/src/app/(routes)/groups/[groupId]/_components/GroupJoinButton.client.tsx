'use client';

import { joinGroup, requestToJoinGroup } from '@/_apiServices/groups';
import { Group } from '@/_types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { group: Group };

export function GroupJoinButton({ group }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      if (group.visibility === 'PUBLIC') {
        await joinGroup(group.id);
        router.refresh();
      } else {
        await requestToJoinGroup(group.id);
        setRequested(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (requested) {
    return <p className="text-sm text-base-content/60 italic">Request sent!</p>;
  }

  return (
    <button className="btn btn-primary btn-sm" onClick={handleJoin} disabled={loading}>
      {loading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : group.visibility === 'PUBLIC' ? (
        'Join Flock'
      ) : (
        'Request to Join'
      )}
    </button>
  );
}
