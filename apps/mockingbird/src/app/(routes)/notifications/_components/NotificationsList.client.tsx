'use client';

import { NotificationWithActor } from '@/_server/notificationService';
import { getNotificationLabel, getNotificationTypeCategory } from '@/_utils/notificationLabel';
import { formatRelativeTime } from '@/_utils/relativeTime';
import {
  BellIcon,
  CheckCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

function TypeIcon({ type }: { type: string }) {
  const category = getNotificationTypeCategory(type);
  if (category === 'friend') {
    return type === 'friend.request'
      ? <UserPlusIcon className="w-3 h-3" />
      : <CheckCircleIcon className="w-3 h-3" />;
  }
  if (category === 'group') return <UserGroupIcon className="w-3 h-3" />;
  return <BellIcon className="w-3 h-3" />;
}

function ActorAvatar({
  actor,
  type,
}: {
  actor: NotificationWithActor['actor'];
  type: string;
}) {
  const initials = actor?.name
    ? actor.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="relative flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden flex items-center justify-center">
        {actor?.image ? (
          <img src={actor.image} alt={actor.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-base-content/60">{initials}</span>
        )}
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center text-primary-content shadow-sm">
        <TypeIcon type={type} />
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationWithActor;
  onMarkRead: (id: string) => void;
}) {
  const label = getNotificationLabel(
    notification.type,
    notification.actor?.name ?? null,
    notification.metadata as Record<string, unknown> | null
  );
  const time = formatRelativeTime(new Date(notification.createdAt));
  const isUnread = !notification.read;

  return (
    <div
      className={`
        group relative flex items-start gap-3.5 px-5 py-4
        transition-all duration-300 cursor-default
        ${isUnread
          ? 'bg-primary/[0.04] border-l-2 border-primary/60'
          : 'border-l-2 border-transparent hover:bg-base-200/40'
        }
      `}
      style={{ animationFillMode: 'both' }}
    >
      <ActorAvatar actor={notification.actor} type={notification.type} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-base-content' : 'font-medium text-base-content/80'}`}>
          {label}
        </p>
        <p className="text-xs text-base-content/40 mt-0.5 font-medium">{time}</p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 self-start pt-0.5">
        {isUnread && (
          <>
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 group-hover:hidden" />
            <button
              onClick={() => onMarkRead(notification.id)}
              className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full hover:bg-primary/10 transition-colors text-primary"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <CheckCircleSolid className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: NotificationWithActor[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch('/api/notifications/all', { method: 'PATCH' });
    router.refresh();
  }, [router]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-base-content/30">
        <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center">
          <BellIcon className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-base-content/50">All caught up</p>
          <p className="text-sm mt-0.5">No notifications yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/40">
            All Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-content text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-base-200/60">
        {notifications.map((notification, i) => (
          <div
            key={notification.id}
            style={{
              animation: `fadeSlideIn 0.3s ease-out ${i * 30}ms both`,
            }}
          >
            <NotificationItem notification={notification} onMarkRead={markRead} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
