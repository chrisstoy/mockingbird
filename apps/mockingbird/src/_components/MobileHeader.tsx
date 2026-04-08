import { sessionUser } from '@/_hooks/sessionUser';
import { getNotificationCount } from '@/_server/notificationCount';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import Image from 'next/image';
import Link from 'next/link';
import { FeedSelector } from './FeedSelector.client';
import { NotificationsAlert } from './NotificationsAlert.client';

export async function MobileHeader() {
  const user = await sessionUser();
  const notificationCount = user ? await getNotificationCount(user.id) : 0;

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
        <FeedSelector />
      </div>
    </header>
  );
}
