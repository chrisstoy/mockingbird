import { getGroupAuditLog } from '@/_server/groupService';
import { GroupIdSchema } from '@/_types';
import { formatRelativeTime } from '@/_utils/relativeTime';

type Props = { groupId: string };

export async function AuditLogTab({ groupId }: Props) {
  const gid = GroupIdSchema.parse(groupId);
  const log = await getGroupAuditLog(gid);

  if (log.length === 0) {
    return <p className="text-base-content/50 text-sm py-4">No audit log entries yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {log.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 text-sm py-2 border-b border-base-200 last:border-0">
          <span className="font-mono text-xs bg-base-200 rounded px-1.5 py-0.5 shrink-0">{entry.action}</span>
          <span className="text-base-content/50 ml-auto shrink-0">{formatRelativeTime(new Date(entry.createdAt))}</span>
        </li>
      ))}
    </ul>
  );
}
