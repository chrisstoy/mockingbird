'use client';
import { FriendStatus, UserId } from '@/_types/users';
import { useFriendCollectionStore } from '../_service/state';
import { FriendCard } from './FriendCard.client';

type Props = {
  onFriendStatusChange: (friendId: UserId, status: FriendStatus) => void;
};

export function Friends({ onFriendStatusChange }: Props) {
  const friends = useFriendCollectionStore((state) => state.friends);
  const friendRequests = useFriendCollectionStore(
    (state) => state.friendRequests
  );
  const pendingFriends = useFriendCollectionStore(
    (state) => state.pendingFriends
  );

  return (
    <>
      {friendRequests.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-title p-3">
            Have requested to be your friend...
          </div>
          <div className="card-body flex flex-row flex-wrap gap-2">
            {friendRequests.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                friendStatus="requested"
                onFriendStatusChange={onFriendStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {pendingFriends.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-title p-3">
            You requested to be friends with...
          </div>
          <div className="card-body flex flex-row flex-wrap gap-2">
            {pendingFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                friendStatus="pending"
                onFriendStatusChange={onFriendStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-title p-3">Friends</div>
        <div className="card-body flex flex-row flex-wrap gap-2">
          {friends.length === 0 && (
            <div className="text-xl">Make some friends!</div>
          )}
          {friends.length > 0 &&
            friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                friendStatus="friend"
                onFriendStatusChange={onFriendStatusChange}
              />
            ))}
        </div>
      </div>
    </>
  );
}
