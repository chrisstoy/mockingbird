'use client';
import { BellIcon, HomeIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import {
  BellIcon as BellIconSolid,
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

function NavItem({
  href,
  label,
  icon: Icon,
  activeIcon: ActiveIcon,
  active,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-colors ${
        active ? 'text-primary bg-primary/10' : 'text-base-content/50'
      }`}
    >
      {active ? (
        <ActiveIcon className="w-6 h-6" />
      ) : (
        <Icon className="w-6 h-6" />
      )}
      <span className="text-[10px] uppercase tracking-widest font-bold mt-1">
        {label}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-3 pb-8 lg:hidden bg-base-100/90 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] border-t border-base-200">
      <NavItem
        href="/"
        label="Home"
        icon={HomeIcon}
        activeIcon={HomeIconSolid}
        active={pathname === '/'}
      />
      <NavItem
        href="/notifications"
        label="Alerts"
        icon={BellIcon}
        activeIcon={BellIconSolid}
        active={pathname.startsWith('/notifications')}
      />
      <NavItem
        href="/groups"
        label="Flocks"
        icon={UserGroupIcon}
        activeIcon={UserGroupIconSolid}
        active={pathname.startsWith('/groups')}
      />
      <NavItem
        href="/friends"
        label="Friends"
        icon={UserGroupIcon}
        activeIcon={UserGroupIconSolid}
        active={pathname.startsWith('/friends')}
      />
      <NavItem
        href="/profile"
        label="Me"
        icon={UserIcon}
        activeIcon={UserIconSolid}
        active={pathname.startsWith('/profile')}
      />
    </nav>
  );
}
