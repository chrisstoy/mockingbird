import { getAllUsers } from '@/_server/adminService';
import Link from 'next/link';
import { RouteParams } from '@/app/types';

export default async function AdminUsersPage({ searchParams }: RouteParams) {
  const sp = await searchParams;
  const page = Number(sp['page'] ?? '1');
  const q = String(sp['q'] ?? '');

  const { users, total, limit } = await getAllUsers(page, 20, q || undefined);
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      <form className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="input input-bordered input-sm flex-1"
        />
        <button type="submit" className="btn btn-sm btn-primary">
          Search
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td className="text-sm">{user.email}</td>
                <td>
                  <span className="badge badge-outline text-xs">
                    {user.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge text-xs ${
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
                <td className="text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="btn btn-xs btn-ghost"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          {total} user{total !== 1 ? 's' : ''}
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
          <span className="join-item btn btn-sm btn-disabled">
            {page} / {totalPages}
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
