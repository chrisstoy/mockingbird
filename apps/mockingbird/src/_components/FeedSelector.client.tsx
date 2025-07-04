'use client';
import { FeedSource, FeedSourceSchema } from '@/_types/feeds';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

const feedFromSearchParams = (params: URLSearchParams): FeedSource => {
  const result = FeedSourceSchema.safeParse(params.get('feed'));
  if (result.success) {
    return result.data;
  }
  return 'public';
};

export function FeedSelector() {
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
    <div role="tablist" className="tabs tabs-boxed">
      <button
        onClick={() => handleSelectChange('public')}
        role="tab"
        className={`tab ${activeFeed === 'public' ? 'tab-active' : ''}`}
      >
        Public
      </button>
      <button
        onClick={() => handleSelectChange('private')}
        role="tab"
        className={`tab ${activeFeed === 'private' ? 'tab-active' : ''}`}
      >
        Friends
      </button>
    </div>
  );
}
