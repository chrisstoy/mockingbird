'use client';
import { FriendStatus, UserId } from '@/_types';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useFriendCollectionStore } from '../_service/state';
import { FriendCard } from './FriendCard.client';

type Props = {
  onFriendStatusChange: (friendId: UserId, status: FriendStatus) => void;
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-base-200">
        <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/40">
          {title}
        </h2>
      </div>
      <div className="p-4 flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function Friends({ onFriendStatusChange }: Props) {
  const friends = useFriendCollectionStore((s) => s.friends);
  const friendRequests = useFriendCollectionStore((s) => s.friendRequests);
  const pendingFriends = useFriendCollectionStore((s) => s.pendingFriends);

  return (
    <div className="flex flex-col gap-4">
      {friendRequests.length > 0 && (
        <SectionCard title="Friend Requests">
          {friendRequests.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              friendStatus="requested"
              onFriendStatusChange={onFriendStatusChange}
            />
          ))}
        </SectionCard>
      )}

      {pendingFriends.length > 0 && (
        <SectionCard title="Pending">
          {pendingFriends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              friendStatus="pending"
              onFriendStatusChange={onFriendStatusChange}
            />
          ))}
        </SectionCard>
      )}

      <SectionCard title="Friends">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-base-content/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-base-content">No friends yet</p>
              <p className="text-xs text-base-content/40 mt-1">
                Search above to find and add people you know.
              </p>
            </div>
          </div>
        ) : (
          friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              friendStatus="friend"
              onFriendStatusChange={onFriendStatusChange}
            />
          ))
        )}
      </SectionCard>
    </div>
  );
}
