'use client';
import { FeedSource, FeedSourceSchema } from '@/_types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'activeFeed';

const feedFromStorage = (): FeedSource => {
  try {
    const result = FeedSourceSchema.safeParse(localStorage.getItem(STORAGE_KEY));
    return result.success ? result.data : 'public';
  } catch {
    return 'public';
  }
};

export function BackButton() {
  const [activeFeed, setActiveFeed] = useState<FeedSource | null>(null);

  useEffect(() => {
    setActiveFeed(feedFromStorage());
  }, []);

  if (activeFeed === null) return null;

  return (
    <Link
      href={`/?feed=${activeFeed}`}
      className="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors mb-4"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Back to Feed
    </Link>
  );
}
