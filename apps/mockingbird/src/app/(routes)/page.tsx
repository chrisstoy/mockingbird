import { FeedList } from '@/_components/FeedList';
import { NewPost } from '@/_components/NewPost.client';
import { getFeedForUser } from '@/_services/feed';
import { Post } from '@/_types/post';
import { auth } from '@/app/auth';

export default async function AppPage() {
  const session = await auth();

  const feed: Post[] = session?.user?.id
    ? await getFeedForUser(session?.user.id)
    : [];

  return (
    <div className="flex flex-col flex-auto">
      <NewPost user={session?.user}></NewPost>
      <FeedList feed={feed}></FeedList>
    </div>
  );
}
