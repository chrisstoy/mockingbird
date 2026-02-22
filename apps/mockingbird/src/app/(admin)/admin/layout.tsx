import { auth } from '@/app/auth';
import Link from 'next/link';
import { AdminNav } from './_components/AdminNav.client';

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
    <div className="flex h-screen bg-base-100">
      <aside
        className="w-60 flex flex-col shrink-0"
        style={{ backgroundColor: '#2c2624', color: '#f6f4f5' }}
      >
        {/* Brand */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(246,244,245,0.08)' }}
        >
          <div
            className="text-xs font-medium mb-1"
            style={{
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(246,244,245,0.35)',
            }}
          >
            Control Panel
          </div>
          <div className="text-base font-bold tracking-tight text-white">
            Mockingbird
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div
            className="text-xs font-medium px-4 mb-2"
            style={{
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(246,244,245,0.28)',
            }}
          >
            Navigation
          </div>
          <AdminNav items={visibleNav} />
        </nav>

        {/* Footer */}
        <div
          className="px-3 pb-5 pt-4"
          style={{ borderTop: '1px solid rgba(246,244,245,0.08)' }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 hover:bg-white/5"
            style={{ color: 'rgba(246,244,245,0.35)' }}
          >
            <span>←</span>
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-base-100">{children}</main>
    </div>
  );
}
