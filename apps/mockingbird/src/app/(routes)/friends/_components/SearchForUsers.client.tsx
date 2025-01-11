'use client';
import { getUsersMatchingSearchTerm } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { FriendStatus, SimpleUserInfo, UserId } from '@/_types/users';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useDebounce } from '@uidotdev/usehooks';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useFriendCollectionStore } from '../_service/state';
import { FriendCard } from './FriendCard.client';

type ExtendedUserInfo = SimpleUserInfo & {
  friendStatus?: FriendStatus;
};

type Props = {
  onFriendStatusChange: (friendId: UserId, status: FriendStatus) => void;
};

export function SearchForUsers({ onFriendStatusChange }: Props) {
  const router = useRouter();
  const user = useSessionUser();

  const friends = useFriendCollectionStore((state) => state.friends);
  const friendRequests = useFriendCollectionStore(
    (state) => state.friendRequests
  );
  const pendingFriends = useFriendCollectionStore(
    (state) => state.pendingFriends
  );

  const [foundUsers, setFoundUsers] = useState<Array<ExtendedUserInfo>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  const updateUserFriendStatus = useCallback(
    (user: ExtendedUserInfo): ExtendedUserInfo => {
      const withUserId = ({ id }: ExtendedUserInfo) => id === user.id;
      if (friends.find(withUserId)) {
        return {
          ...user,
          friendStatus: 'friend',
        };
      }
      if (friendRequests.find(withUserId)) {
        return {
          ...user,
          friendStatus: 'requested',
        };
      }

      if (pendingFriends.find(withUserId)) {
        return {
          ...user,
          friendStatus: 'pending',
        };
      }

      return {
        ...user,
        friendStatus: 'none',
      };
    },
    [friends, friendRequests, pendingFriends]
  );

  const updateSearchTerm = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm]
  );

  useEffect(() => {
    if (debouncedSearchTerm.length < 3) {
      setFoundUsers([]);
      return;
    }

    (async () => {
      setIsSearching(true);
      const matchedUsers: ExtendedUserInfo[] = await getUsersMatchingSearchTerm(
        debouncedSearchTerm
      );
      setIsSearching(false);

      const updatedMatchedUsers = matchedUsers
        .filter((u) => u.id !== user?.id)
        .map(updateUserFriendStatus);

      setFoundUsers(updatedMatchedUsers);
    })();
  }, [
    debouncedSearchTerm,
    setIsSearching,
    setFoundUsers,
    user?.id,
    updateUserFriendStatus,
  ]);

  useEffect(() => {
    const updatedFoundUsers = foundUsers.map(updateUserFriendStatus);
    setFoundUsers(updatedFoundUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- do NOT trigger effect when foundUsers changes since that will cause an infinite loop
  }, [friends, friendRequests, pendingFriends, updateUserFriendStatus]);

  return (
    <div className="form-control">
      <label
        className={`input flex items-center gap-2 ${
          isSearching
            ? 'border-solid border-[oklch(var(--wa))]'
            : 'input-bordered'
        }`}
      >
        <div className="tooltip" data-tip="Clear">
          <button
            className="btn btn-circle btn-ghost btn-xs"
            onClick={() => setSearchTerm('')}
          >
            <XMarkIcon className="h-4 w-4 opacity-70"></XMarkIcon>
          </button>
        </div>
        <input
          type="text"
          placeholder="Enter Name or Email address"
          className="grow"
          value={searchTerm}
          onChange={updateSearchTerm}
        />

        <MagnifyingGlassIcon className="h-4 w-4 opacity-70"></MagnifyingGlassIcon>
      </label>

      <div className="mt-1 flex flex-row flex-wrap gap-2">
        {isSearching ? (
          <div className="text-xs">Searching...</div>
        ) : foundUsers.length > 0 ? (
          foundUsers.map((user) => (
            <FriendCard
              key={user.id}
              friend={user}
              friendStatus={user.friendStatus ?? 'none'}
              onFriendStatusChange={onFriendStatusChange}
            />
          ))
        ) : searchTerm.length > 0 ? (
          <div className="text-xs">No users found.</div>
        ) : null}
      </div>
    </div>
  );
}
