import { FeedList } from '@/_components/FeedList';
import { NewPost } from '@/_components/NewPost.client';
import { sessionUser } from '@/_hooks/sessionUser';
import { Suspense } from 'react';

export default async function AppPage() {
  const user = await sessionUser();

  if (!user) return null;

  return (
    <div className="flex flex-col flex-auto">
      <NewPost user={user}></NewPost>
      <Suspense
        fallback={
          <div className="text-secondary-content m-2 text-center">
            Loading...
          </div>
        }
      >
        <FeedList userId={user.id}></FeedList>
      </Suspense>
    </div>
  );
}
