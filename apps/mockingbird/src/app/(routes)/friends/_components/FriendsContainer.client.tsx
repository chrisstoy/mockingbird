'use client';
import { getFriendsForUser } from '@/_apiServices/friends';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { FriendStatus, UserId } from '@/_types';
import { useCallback, useEffect } from 'react';
import { updateFriendStatusWithUser } from '../_service/service';
import { useFriendCollectionStore } from '../_service/state';
import { Friends } from './Friends.client';
import { SearchForUsers } from './SearchForUsers.client';

export function FriendsContainer() {
  const user = useSessionUser();
  const userId = user?.id;
  const { setCollection } = useFriendCollectionStore();

  useEffect(() => {
    (async () => {
      if (!userId) {
        setCollection({ friends: [], pendingFriends: [], friendRequests: [] });
        return;
      }
      const allFriends = await getFriendsForUser(userId);
      setCollection(allFriends);
    })();
  }, [userId, setCollection]);

  const handleUpdateFriendStatus = useCallback(
    async (friendId: UserId, status: FriendStatus) => {
      if (!userId) return;
      await updateFriendStatusWithUser(userId, friendId, status);
      const allFriends = await getFriendsForUser(userId);
      setCollection(allFriends);
    },
    [userId, setCollection]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Find friends card */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-base-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/40">
            Find Friends
          </h2>
        </div>
        <div className="p-4">
          <SearchForUsers onFriendStatusChange={handleUpdateFriendStatus} />
        </div>
      </div>

      <Friends onFriendStatusChange={handleUpdateFriendStatus} />
    </div>
  );
}
