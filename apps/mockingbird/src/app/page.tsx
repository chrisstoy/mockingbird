import { FeedList } from '@/_components/FeedList';

export default async function AppPage() {
  return (
    <div className="flex flex-col">
      <FeedList></FeedList>
    </div>
  );
}
