import { FriendCard } from '@/_components/FriendCard.client';
import { SearchForUsers } from '@/_components/SearchForUsers.client';
import { getFriendsForUser } from '@/_services/users';
import { auth } from '@/app/auth';

export default async function FriendsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    // TODO - we should never get here!
    return (
      <div>
        <h1>Friends</h1>
        <p>You must be signed in to view your friends</p>
      </div>
    );
  }

  const { friends, pendingFriends, friendRequests } = await getFriendsForUser(
    session.user.id
  );

  return (
    <div className="flex flex-col flex-auto gap-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-title p-3">Add Friends</div>
        <div className="card-body">
          <SearchForUsers></SearchForUsers>
        </div>
      </div>

      {friendRequests.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-title p-3">
            Have requested to be your friend...
          </div>
          <div className="card-body flex flex-row">
            {friendRequests.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-title p-3">
          You requested to be friends with...
        </div>
        <div className="card-body flex flex-row">
          {pendingFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-title p-3">Friends</div>
        <div className="card-body flex flex-row">
          {friends.length === 0 && (
            <div className="text-xl">Make some friends!</div>
          )}
          {friends.length > 0 &&
            friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
        </div>
      </div>
    </div>
  );
}
