import { getAllUsers } from '@/_server/adminService';
import Link from 'next/link';
import { RouteParams } from '@/app/types';

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'badge-error',
  MODERATOR: 'badge-warning',
  EDITOR: 'badge-info',
  USER: 'badge-ghost',
};

export default async function AdminUsersPage({ searchParams }: RouteParams) {
  const sp = await searchParams;
  const page = Number(sp['page'] ?? '1');
  const q = String(sp['q'] ?? '');

  const { users, total, limit } = await getAllUsers(page, 20, q || undefined);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-base-content/40 mb-1">
            Management
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        </div>
        <span className="text-sm text-base-content/50">
          {total} user{total !== 1 ? 's' : ''}
        </span>
      </div>

      <form className="mb-5 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="input input-bordered input-sm flex-1 max-w-sm"
        />
        <button type="submit" className="btn btn-sm btn-primary">
          Search
        </button>
        {q && (
          <Link href="/admin/users" className="btn btn-sm btn-ghost">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-box border border-base-300 mb-5">
        <table className="table table-sm table-zebra w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Name</th>
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Email</th>
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Role</th>
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Status</th>
              <th className="text-xs font-semibold tracking-wider uppercase text-base-content/50">Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover">
                <td className="font-medium">{user.name}</td>
                <td className="text-sm text-base-content/70">{user.email}</td>
                <td>
                  <span className={`badge badge-sm text-xs ${ROLE_BADGE[user.role] ?? 'badge-ghost'}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge badge-sm text-xs ${
                      user.status === 'ACTIVE'
                        ? 'badge-success'
                        : user.status === 'SUSPENDED'
                          ? 'badge-warning'
                          : 'badge-error'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="text-xs text-base-content/50">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="btn btn-xs btn-ghost"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-base-content/40 py-8">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-base-content/50">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <div className="join">
          {page > 1 && (
            <Link
              href={`/admin/users?page=${page - 1}&q=${q}`}
              className="join-item btn btn-sm"
            >
              «
            </Link>
          )}
          <span className="join-item btn btn-sm btn-disabled pointer-events-none">
            {page} / {Math.max(totalPages, 1)}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/users?page=${page + 1}&q=${q}`}
              className="join-item btn btn-sm"
            >
              »
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
