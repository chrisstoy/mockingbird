import { getAuditLog } from '@/_server/adminService';
import { prisma } from '@/_server/db';

export default async function AdminDashboard() {
  const [userCount, postCount, { entries: recentAudit }] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    getAuditLog(1, 10),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-1">
          Overview
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <StatCard label="Total Users" value={userCount} />
        <StatCard label="Total Posts" value={postCount} />
      </div>

      <p className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-3">
        Recent Activity
      </p>
      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-sm table-zebra w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Action</th>
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Actor</th>
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Target</th>
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">When</th>
            </tr>
          </thead>
          <tbody>
            {recentAudit.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <span className="badge badge-sm badge-outline font-mono text-xs">
                    {entry.action}
                  </span>
                </td>
                <td className="font-mono text-xs text-base-content/50">
                  {entry.actorId.slice(0, 10)}…
                </td>
                <td className="font-mono text-xs text-base-content/50">
                  {entry.targetId ? `${entry.targetId.slice(0, 10)}…` : '—'}
                </td>
                <td className="text-xs text-base-content/50">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {recentAudit.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-base-content/40 py-8">
                  No audit entries yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="relative bg-base-100 border border-base-300 rounded-box p-5 pl-8 overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-box"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      />
      <div className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-2">
        {label}
      </div>
      <div className="text-4xl font-bold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
