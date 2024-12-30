import { FriendCollectionSchema, UserId } from '@/_types/users';
import { apiUrlFor } from './api';

export async function getFriendsForUser(userId: UserId) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${userId}/friends`));
    const rawData = await response.json();
    const friends = FriendCollectionSchema.parse(rawData);
    return friends;
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
    const rawData = await response.json();
    const result = rawData;
    return result;
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
    const rawData = await response.json();
    const result = rawData;
    return result;
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
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function cancelFriendRequest(userId: UserId, friendId: UserId) {
  return removeFriend(userId, friendId);
}
