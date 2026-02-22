import { getUserPermissionOverrides } from '@/_server/adminService';
import { getUserById } from '@/_server/usersService';
import { UserIdSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UserAdminControls } from './_components/UserAdminControls.client';

export default async function AdminUserDetailPage(context: RouteContext) {
  const params = await context.params;
  const userId = UserIdSchema.parse(params['userId']);

  const [user, overrides] = await Promise.all([
    getUserById(userId),
    getUserPermissionOverrides(userId),
  ]);

  if (!user) notFound();

  return (
    <div className="p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-base-content/40 mb-6">
        <Link href="/admin/users" className="hover:text-base-content/70 transition-colors">
          Users
        </Link>
        <span>/</span>
        <span className="text-base-content/70">{user.name}</span>
      </div>

      {/* User header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        >
          {(user.name ?? '?')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-sm text-base-content/50">{user.email}</p>
        </div>
      </div>

      <UserAdminControls
        userId={user.id}
        currentRole={user.role}
        currentStatus={user.status}
        permissionOverrides={overrides}
      />
    </div>
  );
}
