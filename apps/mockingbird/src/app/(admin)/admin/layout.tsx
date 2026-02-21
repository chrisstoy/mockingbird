import { auth } from '@/app/auth';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', permission: 'admin:access' },
  { href: '/admin/users', label: 'Users', permission: 'users:view' },
  { href: '/admin/content', label: 'Content', permission: 'posts:view_all' },
  {
    href: '/admin/documents',
    label: 'Documents',
    permission: 'documents:create',
  },
  { href: '/admin/logs', label: 'Logs', permission: 'system:logs' },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const permissions: string[] =
    (session?.user as { permissions?: string[] })?.permissions ?? [];

  const visibleNav = NAV_ITEMS.filter((item) =>
    permissions.includes(item.permission)
  );

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-base-200 flex flex-col p-4 gap-2 shrink-0">
        <div className="text-lg font-bold mb-4">Admin Panel</div>
        <ul className="menu gap-1 p-0">
          {visibleNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <Link href="/" className="btn btn-sm btn-ghost w-full">
            ← Back to App
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
