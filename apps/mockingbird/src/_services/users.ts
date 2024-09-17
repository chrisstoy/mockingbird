import { User } from 'next-auth';
import { apiUrlFor } from './api';
import { Friend } from '@/_types/friends';

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

export async function getFriendsForUser(id: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${id}/friends`));
    const friends = (await response.json()) as {
      friends: Friend[];
      pendingFriends: Friend[];
    };
    return friends;
  } catch (error) {
    console.error(error);
    return {
      friends: [],
      pendingFriends: [],
    };
  }
}
