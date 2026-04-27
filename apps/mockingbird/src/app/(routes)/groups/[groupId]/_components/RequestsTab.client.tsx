'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type JoinRequest = {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
};

type Props = { groupId: string };

export function RequestsTab({ groupId }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/requests`)
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [groupId]);

  const respond = async (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    await fetch(`/api/groups/${groupId}/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (status === 'ACCEPTED') router.refresh();
  };

  if (loading) return <div className="flex justify-center py-8"><span className="loading loading-spinner" /></div>;
  if (requests.length === 0) return <p className="text-base-content/50 text-sm py-4">No pending requests.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {requests.map((req) => (
        <li key={req.id} className="flex items-center gap-3 bg-base-100 rounded-xl border border-base-200 px-4 py-3">
          {req.user.image && (
            <img src={req.user.image} alt={req.user.name} className="w-8 h-8 rounded-full object-cover" />
          )}
          <span className="flex-1 font-medium">{req.user.name}</span>
          <button className="btn btn-success btn-xs" onClick={() => respond(req.id, 'ACCEPTED')}>Accept</button>
          <button className="btn btn-ghost btn-xs" onClick={() => respond(req.id, 'DECLINED')}>Decline</button>
        </li>
      ))}
    </ul>
  );
}
