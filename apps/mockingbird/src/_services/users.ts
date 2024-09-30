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

export async function getUsersMatchingSearchTerm(searchTerm: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users?q=${searchTerm}`));
    const users = (await response.json()) as UserInfo[];
    return users;
  } catch (error) {
    console.error(error);
    return [];
  }
}
