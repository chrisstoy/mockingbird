'use client';
import { FeedSource, FeedSourceSchema } from '@/_types';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

export type FeedItem = {
  key: FeedSource;
  label: string;
};

const DEFAULT_FEEDS: FeedItem[] = [
  { key: 'public', label: 'Public' },
  { key: 'private', label: 'Friends' },
];

const feedFromSearchParams = (params: URLSearchParams): FeedSource => {
  const result = FeedSourceSchema.safeParse(params.get('feed'));
  if (result.success) {
    return result.data;
  }
  return 'public';
};

type Props = {
  feeds?: FeedItem[];
};

export function FeedSelector({ feeds = DEFAULT_FEEDS }: Props) {
  const params = useSearchParams();
  const router = useRouter();

  const [activeFeed, setActiveFeed] = React.useState<FeedSource>(
    feedFromSearchParams(params)
  );

  useEffect(() => {
    setActiveFeed(feedFromSearchParams(params));
  }, [params]);

  const handleSelectChange = (newFeed: FeedSource) => {
    if (newFeed !== activeFeed) {
      router.push(`/?feed=${newFeed}`);
    }
  };

  return (
    <div className="flex gap-1 bg-base-200 rounded-xl p-1 overflow-x-auto max-w-full scrollbar-none">
      {feeds.map((feed) => {
        const isActive = activeFeed === feed.key;
        return (
          <button
            key={feed.key}
            onClick={() => handleSelectChange(feed.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-primary text-primary-content shadow-sm'
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            {feed.label}
          </button>
        );
      })}
    </div>
  );
}
