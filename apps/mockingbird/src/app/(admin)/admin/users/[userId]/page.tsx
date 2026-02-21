import { getUserPermissionOverrides } from '@/_server/adminService';
import { getUserById } from '@/_server/usersService';
import { UserIdSchema } from '@/_types';
import { RouteContext } from '@/app/types';
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
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
      <p className="text-base-content/60 text-sm mb-6">{user.email}</p>

      <UserAdminControls
        userId={user.id}
        currentRole={user.role}
        currentStatus={user.status}
        permissionOverrides={overrides}
      />
    </div>
  );
}
