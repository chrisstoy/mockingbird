import { sessionUser } from '@/_hooks/sessionUser';
import { GENERIC_USER_IMAGE_URL } from '@/constants';
import { BellIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { FeedSelector } from './FeedSelector.client';

function nameToHandle(name: string) {
  return '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function AppHeader() {
  const user = await sessionUser();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-base-100/95 backdrop-blur-sm border-b border-base-200 flex items-center px-6 gap-4">
      <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
        <Image
          src="/images/mockingbird-logo.png"
          alt="Mockingbird"
          width={28}
          height={28}
          className="w-7 h-7 object-contain"
        />
        <span className="font-extrabold tracking-tight text-base-content text-lg leading-none">
          Mockingbird
        </span>
      </Link>

      <div className="flex-1 flex justify-center">
        <FeedSelector />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          className="p-2.5 rounded-full hover:bg-base-200 active:bg-base-300 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon className="w-5.5 h-5.5 text-base-content/55" />
        </button>
        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-base-200 transition-colors"
          >
            <img
              src={user.image ?? GENERIC_USER_IMAGE_URL}
              alt={user.name ?? 'Profile'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight text-base-content">
                {user.name}
              </p>
              <p className="text-xs text-base-content/50 leading-tight">
                {nameToHandle(user.name ?? 'user')}
              </p>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
