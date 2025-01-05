import { getFeedForUser } from '@/_server/feedService';
import { UserId } from '@/_types/users';
import { SummaryPost } from './SummaryPost';

type Props = {
  userId: UserId;
};
export async function FeedList({ userId }: Props) {
  const feed = await getFeedForUser(userId);

  const sortedFeed = feed.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ul className="list-none max-w-2xl">
      {sortedFeed.map((post) => (
        <li className="m-2" key={post.id}>
          <SummaryPost post={post} linkToDetails showFirstComment />
        </li>
      ))}
    </ul>
  );
}
