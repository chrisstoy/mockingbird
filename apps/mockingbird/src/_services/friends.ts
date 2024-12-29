import { apiUrlFor } from './api';
import { UserId, UserInfo } from '@/_types/users';

interface FriendsForUser {
  friends: UserInfo[];
  pendingFriends: UserInfo[];
  friendRequests: UserInfo[];
}

export async function getFriendsForUser(userId: UserId) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${userId}/friends`));
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

export async function requestFriend(userId: UserId, friendId: UserId) {
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

export async function acceptFriendRequest(userId: UserId, friendId: UserId) {
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

export async function removeFriend(userId: UserId, friendId: UserId) {
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

export async function cancelFriendRequest(userId: UserId, friendId: UserId) {
  return removeFriend(userId, friendId);
}
