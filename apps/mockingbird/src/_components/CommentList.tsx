import { Post } from '@/_types/post';
import { useMemo } from 'react';
import { Comment } from './Comment';

const sortByCreatedAtAsc = (a: { createdAt: Date }, b: { createdAt: Date }) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

type Props = {
  feed: Post[];
  originalPost: Post;
  linkToDetails?: boolean;
  hideReplies?: boolean;
};
export async function CommentList({
  feed,
  originalPost,
  linkToDetails = false,
  hideReplies = false,
}: Props) {
  const sortedFeed = useMemo(() => {
    return feed.sort(sortByCreatedAtAsc);
  }, [feed]);

  return (
    <ul className="list-none max-w-2xl">
      {sortedFeed.map((post) => (
        <li className="ml-2 mb-3" key={post.id}>
          <Comment
            comment={post}
            linkToDetails={linkToDetails}
            originalPost={originalPost}
            hideReplies={hideReplies}
          />
        </li>
      ))}
    </ul>
  );
}
