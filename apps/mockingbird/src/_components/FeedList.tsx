import { getFeed } from '@/_server/feedService';
import { FeedSource, Post, UserId } from '@/_types';
import { NoPostsInFeed } from './NoPostsInFeed';
import { SummaryPost } from './SummaryPost';

type Props = {
  userId: UserId;
  feedSource: FeedSource;
};
export async function FeedList({ userId, feedSource }: Props) {
  let feed: Array<Post> = [];

  try {
    feed = await getFeed({ userId, feedSource });
  } catch (error) {
    console.error(error);
    feed = [];
  }

  return (
    <ul className="list-none max-w-2xl">
      {feed.length > 0 ? (
        feed.map((post) => (
          <li className="m-2" key={post.id}>
            <SummaryPost post={post} linkToDetails showFirstComment />
          </li>
        ))
      ) : (
        <li className="m-2">
          <NoPostsInFeed></NoPostsInFeed>
        </li>
      )}
    </ul>
  );
}
