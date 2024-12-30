import { UserId, UserInfoSchema } from '@/_types/users';
import { apiUrlFor } from './api';
import { z } from 'zod';

export async function getUser(id: UserId) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${id}`));
    const rawData = await response.json();
    const user = UserInfoSchema.parse(rawData);
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function getUsersMatchingSearchTerm(searchTerm: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users?q=${searchTerm}`));
    const rawData = await response.json();
    const users = z.array(UserInfoSchema).parse(rawData);
    return users;
  } catch (error) {
    console.error(error);
    return [];
  }
}