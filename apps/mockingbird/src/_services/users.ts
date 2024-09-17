import { User } from 'next-auth';
import { apiUrlFor } from './api';

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
    const friends = (await response.json()) as Array<{
      id: string;
      name: string;
      image: string;
    }>;
    return friends;
  } catch (error) {
    console.error(error);
    return [];
  }
}
