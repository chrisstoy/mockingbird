import { getAuditLog } from '@/_server/adminService';
import { prisma } from '@/_server/db';

export default async function AdminDashboard() {
  const [userCount, postCount, { entries: recentAudit }] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    getAuditLog(1, 10),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{userCount}</div>
        </div>
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-title">Total Posts</div>
          <div className="stat-value">{postCount}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Audit Log</h2>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>Target</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {recentAudit.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <span className="badge badge-outline">{entry.action}</span>
                </td>
                <td className="font-mono text-xs">{entry.actorId}</td>
                <td className="font-mono text-xs">{entry.targetId ?? '—'}</td>
                <td className="text-xs">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {recentAudit.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-base-content/50">
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
