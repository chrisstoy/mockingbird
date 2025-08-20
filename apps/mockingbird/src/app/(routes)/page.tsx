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
    <div className="flex flex-col flex-auto">
      <NewPost user={user}></NewPost>
      <Suspense
        fallback={
          <div className="text-secondary-content m-2 text-center">
            <ul>
              <li className="m-2" key="1">
                <SkeletonSummaryPost></SkeletonSummaryPost>
              </li>
              <li className="m-2" key="2">
                <SkeletonSummaryPost></SkeletonSummaryPost>
              </li>
            </ul>
          </div>
        }
      >
        <FeedList userId={user.id} feedSource={feedSource}></FeedList>
      </Suspense>
    </div>
  );
}
