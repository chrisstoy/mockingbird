import { FeedList } from '@/_components/FeedList';
import { GroupId, UserId } from '@/_types';

type Props = { userId: UserId; groupId: GroupId };

export async function GroupFeed({ userId, groupId }: Props) {
  return <FeedList userId={userId} feedSource={groupId} />;
}
