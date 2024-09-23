import { FriendCollection, UserInfo } from '@/_types/users';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension'; // required for devtools typing

export interface FriendCollectionState {
  friends: UserInfo[];
  pendingFriends: UserInfo[];
  friendRequests: UserInfo[];

  setCollection(all: FriendCollection): void;
  setFriends(friends: UserInfo[]): void;
  setPendingFriends(pendingFriends: UserInfo[]): void;
  setFriendRequests(friendRequests: UserInfo[]): void;
}

export const useFriendCollectionStore = create<FriendCollectionState>()(
  devtools(
    (set) => ({
      friends: [],
      pendingFriends: [],
      friendRequests: [],

      setCollection(all: FriendCollection) {
        set(all);
      },

      setFriends(friends: UserInfo[]) {
        set({ friends });
      },
      setPendingFriends(pendingFriends: UserInfo[]) {
        set({ pendingFriends });
      },
      setFriendRequests(friendRequests: UserInfo[]) {
        set({ friendRequests });
      },
    }),
    { name: 'friendCollection' }
  )
);
