import { Post } from '@/_types/post';
import { Comment } from './Comment';
import { useMemo } from 'react';

type Props = {
  feed: Post[];
  originalPostId: string;
};
export async function CommentList({ feed, originalPostId }: Props) {
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
          <Comment post={post} originalPostId={originalPostId} />
        </li>
      ))}
    </ul>
  );
}
