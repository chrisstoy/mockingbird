import { User } from 'next-auth';
import { apiUrlFor } from './api';
import { UserInfo } from '@/_types/users';

export async function getUser(id: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${id}`));
    const user: User = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

interface FriendsForUser {
  friends: UserInfo[];
  pendingFriends: UserInfo[];
  friendRequests: UserInfo[];
}

export async function getFriendsForUser(id: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${id}/friends`));
    const { friends, pendingFriends, friendRequests } =
      (await response.json()) as FriendsForUser;

    const result: FriendsForUser = {
      friends: friends.map((friend) => ({
        ...friend,
        friendStatus: 'accepted',
      })),
      pendingFriends: pendingFriends.map((friend) => ({
        ...friend,
        friendStatus: 'pending',
      })),
      friendRequests: friendRequests.map((friend) => ({
        ...friend,
        friendStatus: 'requested',
      })),
    };
    return result;
  } catch (error) {
    console.error(error);
    return {
      friends: [],
      pendingFriends: [],
      friendRequests: [],
    };
  }
}

export async function getUsersMatchingSearchTerm(searchTerm: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users?q=${searchTerm}`));
    const users = (await response.json()) as UserInfo[];
    return users;
    // return Promise.resolve([]);
  } catch (error) {
    console.error(error);
    return [];
  }
}
