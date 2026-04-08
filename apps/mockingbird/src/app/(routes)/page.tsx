import { FeedList } from '@/_components/FeedList';
import { NewPost } from '@/_components/NewPost.client';
import { SkeletonSummaryPost } from '@/_components/SkeletonSummaryPost';
import { sessionUser } from '@/_hooks/sessionUser';
import { FeedSource, FeedSourceSchema } from '@/_types';
import { Suspense } from 'react';
import { z } from 'zod';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AppPage({ searchParams }: Props) {
  const user = await sessionUser();
  if (!user) return null;

  const { success, data } = z
    .object({ feed: FeedSourceSchema })
    .safeParse(await searchParams);

  const feedSource: FeedSource = success ? data.feed : 'public';

  return (
    <div>
      <NewPost user={user} />

      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <SkeletonSummaryPost />
            <SkeletonSummaryPost />
          </div>
        }
      >
        <FeedList userId={user.id} feedSource={feedSource} />
      </Suspense>
    </div>
  );
}
