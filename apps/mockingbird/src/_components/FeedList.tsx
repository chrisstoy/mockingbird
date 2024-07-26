import { mockFeed } from '../_services/feedService';
import { SummaryPost } from './SummaryPost';

export async function FeedList() {
  const postsInFeed = mockFeed;

  return (
    <ul className="list-none max-w-2xl">
      {postsInFeed.map((post) => (
        <li className="m-2" key={post.id}>
          <SummaryPost post={post} />
        </li>
      ))}
    </ul>
  );
}
