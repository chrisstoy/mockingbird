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
    <div className="flex flex-col gap-4">
      {feed.length > 0 ? (
        feed.map((post) => (
          <div key={post.id} data-testid="feed-post">
            <SummaryPost post={post} linkToDetails showFirstComment />
          </div>
        ))
      ) : (
        <NoPostsInFeed />
      )}
    </div>
  );
}
