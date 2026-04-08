'use client';
import { getUsersMatchingSearchTerm } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { FriendStatus, SimpleUserInfo, UserId } from '@/_types';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useDebounce } from '@uidotdev/usehooks';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useFriendCollectionStore } from '../_service/state';
import { FriendCard } from './FriendCard.client';

type ExtendedUserInfo = SimpleUserInfo & { friendStatus?: FriendStatus };

type Props = {
  onFriendStatusChange: (friendId: UserId, status: FriendStatus) => void;
};

export function SearchForUsers({ onFriendStatusChange }: Props) {
  const user = useSessionUser();
  const friends = useFriendCollectionStore((s) => s.friends);
  const friendRequests = useFriendCollectionStore((s) => s.friendRequests);
  const pendingFriends = useFriendCollectionStore((s) => s.pendingFriends);

  const [foundUsers, setFoundUsers] = useState<ExtendedUserInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  const updateUserFriendStatus = useCallback(
    (u: ExtendedUserInfo): ExtendedUserInfo => {
      const byId = ({ id }: ExtendedUserInfo) => id === u.id;
      if (friends.find(byId)) return { ...u, friendStatus: 'friend' };
      if (friendRequests.find(byId)) return { ...u, friendStatus: 'requested' };
      if (pendingFriends.find(byId)) return { ...u, friendStatus: 'pending' };
      return { ...u, friendStatus: 'none' };
    },
    [friends, friendRequests, pendingFriends]
  );

  const updateSearchTerm = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm.length < 3) {
      setFoundUsers([]); // eslint-disable-line react-hooks/set-state-in-effect -- resetting search results in response to external debounced input
      return;
    }
    (async () => {
      setIsSearching(true);
      const matched: ExtendedUserInfo[] = await getUsersMatchingSearchTerm(debouncedSearchTerm);
      setIsSearching(false);
      setFoundUsers(
        matched
          .filter((u) => u.id !== user?.id)
          .map(updateUserFriendStatus)
      );
    })();
  }, [debouncedSearchTerm, user?.id, updateUserFriendStatus]);

  useEffect(() => {
    setFoundUsers((prev) => prev.map(updateUserFriendStatus)); // eslint-disable-line react-hooks/set-state-in-effect -- re-mapping friend statuses when friend collection changes
  }, [friends, friendRequests, pendingFriends, updateUserFriendStatus]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or email…"
          className="w-full bg-base-200 border-none rounded-xl py-2.5 pl-10 pr-10 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          value={searchTerm}
          onChange={updateSearchTerm}
        />
        {searchTerm && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-base-300 transition-colors"
            onClick={() => setSearchTerm('')}
            aria-label="Clear"
          >
            <XMarkIcon className="w-4 h-4 text-base-content/40" />
          </button>
        )}
      </div>

      {/* Results */}
      {isSearching && (
        <p className="text-xs text-base-content/40 px-1">Searching…</p>
      )}
      {!isSearching && foundUsers.length > 0 && (
        <div className="flex flex-col gap-2">
          {foundUsers.map((u) => (
            <FriendCard
              key={u.id}
              friend={u}
              friendStatus={u.friendStatus ?? 'none'}
              onFriendStatusChange={onFriendStatusChange}
            />
          ))}
        </div>
      )}
      {!isSearching && searchTerm.length >= 3 && foundUsers.length === 0 && (
        <p className="text-xs text-base-content/40 px-1">No users found.</p>
      )}
      {!isSearching && searchTerm.length > 0 && searchTerm.length < 3 && (
        <p className="text-xs text-base-content/40 px-1">Type at least 3 characters to search.</p>
      )}
    </div>
  );
}
