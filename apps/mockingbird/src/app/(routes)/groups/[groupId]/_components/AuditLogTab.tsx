import { formatRelativeTime } from '@/_utils/relativeTime';

type AuditEntry = {
  id: string;
  actorId: string;
  action: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
};

type Props = { groupId: string };

async function fetchAuditLog(groupId: string): Promise<AuditEntry[]> {
  const res = await fetch(`/api/groups/${groupId}/audit`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function AuditLogTab({ groupId }: Props) {
  const log = await fetchAuditLog(groupId);

  if (log.length === 0) {
    return <p className="text-base-content/50 text-sm py-4">No audit log entries yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {log.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 text-sm py-2 border-b border-base-200 last:border-0">
          <span className="font-mono text-xs bg-base-200 rounded px-1.5 py-0.5 shrink-0">{entry.action}</span>
          <span className="text-base-content/50 ml-auto shrink-0">{formatRelativeTime(entry.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
