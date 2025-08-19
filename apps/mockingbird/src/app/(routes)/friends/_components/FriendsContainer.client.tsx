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

  const { setCollection } = useFriendCollectionStore();

  useEffect(() => {
    (async () => {
      if (!user?.id) {
        setCollection({
          friends: [],
          pendingFriends: [],
          friendRequests: [],
        });
        return;
      }
      const allFriends = await getFriendsForUser(user.id);
      setCollection(allFriends);
    })();
  }, [user?.id, setCollection]);

  const handleUpdateFriendStatus = useCallback(
    async (friendId: UserId, status: FriendStatus) => {
      if (!user?.id) {
        return;
      }

      await updateFriendStatusWithUser(user.id, friendId, status);
      // TODO - refresh friends in store instead of reloading
      const allFriends = await getFriendsForUser(user.id);
      setCollection(allFriends);
    },
    [user?.id, setCollection]
  );

  return (
    <div className="flex flex-col flex-auto gap-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-title p-3">Add Friends</div>
        <div className="card-body">
          <SearchForUsers
            onFriendStatusChange={handleUpdateFriendStatus}
          ></SearchForUsers>
        </div>
      </div>
      <Friends onFriendStatusChange={handleUpdateFriendStatus}></Friends>
    </div>
  );
}
