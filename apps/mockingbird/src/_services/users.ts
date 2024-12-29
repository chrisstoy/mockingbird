import { UserId, UserInfo, UserInfoSchema } from '@/_types/users';
import { apiUrlFor } from './api';

export async function getUser(id: UserId) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${id}`));
    const user = UserInfoSchema.parse(await response.json());
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
