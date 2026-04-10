'use client';
import { BellIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Props {
  count: number;
}

export function NotificationsAlert({ count }: Props) {
  return (
    <Link
      href="/friends"
      className="relative p-2.5 rounded-full hover:bg-base-200 active:bg-base-300 transition-colors flex items-center justify-center"
      aria-label={
        count > 0
          ? `${count} notification${count !== 1 ? 's' : ''}`
          : 'Notifications'
      }
      title="Notifications"
    >
      <BellIcon className="w-5.5 h-5.5 text-base-content/55" />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-content text-[10px] font-bold leading-4 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
