'use client';
import {
  BellIcon,
  HomeIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LeftSidebar() {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isFriends = pathname.startsWith('/friends');
  const isProfile = pathname.startsWith('/profile');

  return (
    <aside className="w-60 fixed left-0 top-14 h-[calc(100vh-3.5rem-2.5rem)] hidden lg:flex flex-col px-5 py-6 bg-base-100 border-r border-base-200 z-40">
      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-semibold text-lg ${
            isHome
              ? 'text-base-content bg-base-200'
              : 'text-base-content/60 hover:text-base-content hover:bg-base-200/60'
          }`}
        >
          {isHome ? (
            <HomeIconSolid className="w-6 h-6" />
          ) : (
            <HomeIcon className="w-6 h-6" />
          )}
          <span>Home</span>
        </Link>

        <Link
          href="/friends"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-semibold text-lg ${
            isFriends
              ? 'text-base-content bg-base-200'
              : 'text-base-content/60 hover:text-base-content hover:bg-base-200/60'
          }`}
        >
          <UserGroupIcon className="w-6 h-6" />
          <span>Friends</span>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-semibold text-lg text-base-content/60 hover:text-base-content hover:bg-base-200/60"
        >
          <BellIcon className="w-6 h-6" />
          <span>Alerts</span>
        </Link>

        <Link
          href="/profile"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-semibold text-lg ${
            isProfile
              ? 'text-base-content bg-base-200'
              : 'text-base-content/60 hover:text-base-content hover:bg-base-200/60'
          }`}
        >
          <UserIcon className="w-6 h-6" />
          <span>Profile</span>
        </Link>
      </nav>
    </aside>
  );
}
