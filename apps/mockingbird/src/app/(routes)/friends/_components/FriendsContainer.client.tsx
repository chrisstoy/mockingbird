'use client';
import { getFriendsForUser } from '@/_services/users';
import { FriendStatus } from '@/_types/users';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { updateFriendStatusWithUser } from '../_service/service';
import { useFriendCollectionStore } from '../_service/state';
import { Friends } from './Friends.client';
import { SearchForUsers } from './SearchForUsers.client';

export function FriendsContainer() {
  const { data: session } = useSession();
  const { setCollection } = useFriendCollectionStore();

  useEffect(() => {
    (async () => {
      if (!session?.user?.id) {
        setCollection({
          friends: [],
          pendingFriends: [],
          friendRequests: [],
        });
        return;
      }
      const allFriends = await getFriendsForUser(session?.user?.id);
      setCollection(allFriends);
    })();
  }, [session?.user?.id, setCollection]);

  const updateFriendStatus = async (friendId: string, status: FriendStatus) => {
    if (!session?.user?.id) {
      return;
    }

    await updateFriendStatusWithUser(session?.user?.id, friendId, status);
    // TODO - refresh friends in store instead of reloading
    const allFriends = await getFriendsForUser(session?.user?.id);
    setCollection(allFriends);
  };

  return (
    <div className="flex flex-col flex-auto gap-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-title p-3">Add Friends</div>
        <div className="card-body">
          <SearchForUsers
            onFriendStatusChange={updateFriendStatus}
          ></SearchForUsers>
        </div>
      </div>
      <Friends onFriendStatusChange={updateFriendStatus}></Friends>
    </div>
  );
}
