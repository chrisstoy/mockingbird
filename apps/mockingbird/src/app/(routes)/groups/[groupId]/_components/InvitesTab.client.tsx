'use client';

import { useEffect, useState } from 'react';

type Invite = {
  id: string;
  invitedUserId: string;
  status: string;
  createdAt: string;
  invitedUser: { id: string; name: string; image: string | null };
};

type Props = { groupId: string };

export function InvitesTab({ groupId }: Props) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/invites`)
      .then((r) => r.json())
      .then(setInvites)
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <div className="flex justify-center py-8"><span className="loading loading-spinner" /></div>;
  if (invites.length === 0) return <p className="text-base-content/50 text-sm py-4">No pending invites.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {invites.map((inv) => (
        <li key={inv.id} className="flex items-center gap-3 bg-base-100 rounded-xl border border-base-200 px-4 py-3">
          {inv.invitedUser.image && (
            <img src={inv.invitedUser.image} alt={inv.invitedUser.name} className="w-8 h-8 rounded-full object-cover" />
          )}
          <span className="flex-1 font-medium">{inv.invitedUser.name}</span>
          <span className="badge badge-ghost badge-sm">Pending</span>
        </li>
      ))}
    </ul>
  );
}
