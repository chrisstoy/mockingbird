'use client';

import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { FriendCard } from './FriendCard.client';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useDebounce } from '@uidotdev/usehooks';
import { getUsersMatchingSearchTerm } from '@/_services/users';
import { UserInfo } from '@/_types/users';
import { useSession } from 'next-auth/react';

type Props = {
  friends: {
    friends: UserInfo[];
    pendingFriends: UserInfo[];
    friendRequests: UserInfo[];
  };
};

type ExtendedUserInfo = UserInfo & {
  friendStatus?: 'friend' | 'pending' | 'requested' | 'none';
};

export function SearchForUsers({ friends }: Props) {
  const { data: session } = useSession();
  const [foundUsers, setFoundUsers] = useState<Array<ExtendedUserInfo>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

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
    const searchUsers = async () => {
      setIsSearching(true);
      const matchedUsers: ExtendedUserInfo[] = await getUsersMatchingSearchTerm(
        debouncedSearchTerm
      );
      setIsSearching(false);
      console.log(`Found users: ${JSON.stringify(matchedUsers)}`);

      const createMatchUserWithIdPredicate = (id: string) => (user: UserInfo) =>
        user.id === id;

      // update friend status for each user
      for (const user of matchedUsers) {
        const userWithId = createMatchUserWithIdPredicate(user.id);
        if (friends.friends.find(userWithId)) {
          user.friendStatus = 'friend';
        } else if (friends.pendingFriends.find(userWithId)) {
          user.friendStatus = 'pending';
        } else if (friends.friendRequests.find(userWithId)) {
          user.friendStatus = 'requested';
        } else {
          user.friendStatus = 'none';
        }
      }
      setFoundUsers(matchedUsers.filter((u) => u.id !== session?.user?.id));
    };
    searchUsers();
  }, [debouncedSearchTerm, setIsSearching, setFoundUsers]);

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
            />
          ))
        ) : searchTerm.length > 0 ? (
          <div className="text-xs">No users found.</div>
        ) : null}
      </div>
    </div>
  );
}
