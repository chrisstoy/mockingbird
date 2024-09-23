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

    const result = {
      friends,
      pendingFriends,
      friendRequests,
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

export async function requestFriend(userId: string, friendId: string) {
  try {
    const response = await fetch(
      await apiUrlFor(`/users/${userId}/friends/${friendId}`),
      {
        method: 'PUT',
      }
    );
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function acceptFriendRequest(userId: string, friendId: string) {
  try {
    const response = await fetch(
      await apiUrlFor(`/users/${userId}/friends/${friendId}`),
      {
        method: 'POST',
        body: JSON.stringify({
          accepted: true,
        }),
      }
    );
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function removeFriend(userId: string, friendId: string) {
  try {
    const response = await fetch(
      await apiUrlFor(`/users/${userId}/friends/${friendId}`),
      {
        method: 'DELETE',
      }
    );
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function cancelFriendRequest(userId: string, friendId: string) {
  return removeFriend(userId, friendId);
}
