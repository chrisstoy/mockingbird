import { Friend } from '@/_components/Friend';
import { getFriendsForUser } from '@/_services/users';
import { auth } from '@/app/auth';

export default async function FriendsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div>
        <h1>Friends</h1>
        <p>You must be signed in to view your friends</p>
      </div>
    );
  }

  const { friends, pendingFriends } = await getFriendsForUser(session.user.id);

  return (
    <div>
      <h1>Pending Friends</h1>
      {pendingFriends.map((friend) => (
        <Friend key={friend.id} friendId={friend.id} />
      ))}

      <h1>Friends</h1>
      {friends.map((friend) => (
        <Friend key={friend.id} friendId={friend.id} />
      ))}
    </div>
  );
}
