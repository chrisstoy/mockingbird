import { sessionUser } from '@/_hooks/sessionUser';
import { getGroupMembershipsForUser } from '@/_server/groupService';
import { getNotificationCount } from '@/_server/notificationCount';
import { UserIdSchema } from '@/_types';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import Image from 'next/image';
import Link from 'next/link';
import { FeedbackButton } from './FeedbackButton.client';
import { FeedItem, FeedSelector } from './FeedSelector.client';
import { NotificationsAlert } from './NotificationsAlert.client';

const DEFAULT_FEEDS: FeedItem[] = [
  { key: 'public', label: 'Public' },
  { key: 'private', label: 'Friends' },
];

export async function MobileHeader() {
  const user = await sessionUser();
  const notificationCount = user ? await getNotificationCount(user.id) : 0;

  const groupFeeds: FeedItem[] = user
    ? (await getGroupMembershipsForUser(UserIdSchema.parse(user.id))).map((m) => ({
        key: m.groupId,
        label: `🐦 ${m.group.name}`,
      }))
    : [];
  const feeds = [...DEFAULT_FEEDS, ...groupFeeds];

  return (
    <header className="fixed top-0 left-0 w-full z-40 lg:hidden bg-base-100/95 backdrop-blur-xl border-b border-base-200">
      {/* Top row: logo + icons */}
      <div className="flex items-center justify-between px-5 h-14">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/mockingbird-logo.png"
            alt="Mockingbird"
            width={26}
            height={26}
            className="w-6.5 h-6.5 object-contain"
          />
          <span className="font-extrabold tracking-tight text-base-content text-[17px] leading-none">
            Mockingbird
          </span>
        </Link>
        <div className="flex items-center gap-0.5">
          <FeedbackButton
            userName={user?.name}
            userEmail={user?.email}
            userId={user?.id}
          />
          <NotificationsAlert count={notificationCount} />
          {user && (
            <Link href="/profile" className="ml-1">
              <img
                src={user.image ?? GENERIC_USER_IMAGE_URL}
                alt={user.name ?? 'Profile'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-base-200"
              />
            </Link>
          )}
        </div>
      </div>

      {/* Feed selector row */}
      <div className="px-5 pt-1 pb-3">
        <FeedSelector feeds={feeds} />
      </div>
    </header>
  );
}
