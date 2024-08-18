import { Post } from '@/_types/post';
import { SummaryPost } from './SummaryPost';
import { useMemo } from 'react';

type Props = {
  feed: Post[];
};
export async function FeedList({ feed }: Props) {
  const sortedFeed = useMemo(() => {
    return feed.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [feed]);

  return (
    <ul className="list-none max-w-2xl">
      {sortedFeed.map((post) => (
        <li className="m-2" key={post.id}>
          <SummaryPost post={post} />
        </li>
      ))}
    </ul>
  );
}
