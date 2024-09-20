'use client';

import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { FriendCard } from './FriendCard.client';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useDebounce } from '@uidotdev/usehooks';
import { getUsersMatchingSearchTerm } from '@/_services/users';
import { UserInfo } from '@/_types/users';

export function SearchForUsers() {
  const [foundUsers, setFoundUsers] = useState<Array<UserInfo>>([]);
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
      const matchedUsers = await getUsersMatchingSearchTerm(
        debouncedSearchTerm
      );
      setIsSearching(false);
      console.log(`Found users: ${JSON.stringify(matchedUsers)}`);
      setFoundUsers(matchedUsers);
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
          foundUsers.map((user) => <FriendCard key={user.id} friend={user} />)
        ) : searchTerm.length > 0 ? (
          <div className="text-xs">No users found.</div>
        ) : null}
      </div>
    </div>
  );
}
