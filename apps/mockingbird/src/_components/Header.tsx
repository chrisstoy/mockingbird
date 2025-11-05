import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { FeedSelector } from './FeedSelector.client';
import { UserButton } from './UserButton.client';

export function Header() {
  return (
    <div className="navbar bg-neutral text-neutral-content w-full">
      <Link href="/" className="w-1/3 flex justify-start">
        <Image
          className={'ml-2 w-auto h-auto'}
          src="/images/mockingbird-white.png"
          alt="Mockingbird"
          width={64}
          height={64}
        />
        <div className="hidden sm:block">Mockingbird</div>
      </Link>
      <div className="flex-grow flex justify-center">
        <Suspense fallback={<div>...</div>}>
          <FeedSelector />
        </Suspense>
      </div>
      <div className="w-1/3 flex justify-end">
        <UserButton />
      </div>
    </div>
  );
}
