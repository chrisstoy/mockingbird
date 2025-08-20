import { FriendCollection, SimpleUserInfo, UserInfo } from '@/_types';
import type {} from '@redux-devtools/extension'; // required for devtools typing
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface FriendCollectionState extends FriendCollection {
  setCollection(all: FriendCollection): void;
  setFriends(friends: SimpleUserInfo[]): void;
  setPendingFriends(pendingFriends: SimpleUserInfo[]): void;
  setFriendRequests(friendRequests: SimpleUserInfo[]): void;
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
