import { UserInfo } from '@/_types/users';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type FriendCollection = {
  friends: UserInfo[];
  pendingFriends: UserInfo[];
  friendRequests: UserInfo[];
};

export interface FriendCollectionState extends FriendCollection {
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
