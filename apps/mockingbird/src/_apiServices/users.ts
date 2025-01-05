import { UserId, UserInfoSchema } from '@/_types/users';
import { z } from 'zod';
import { fetchFromServer } from './fetchFromServer';

export async function getUser(id: UserId) {
  try {
    const response = await fetchFromServer(`/users/${id}`);
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
    const response = await fetchFromServer(`/users?q=${searchTerm}`);
    const rawData = await response.json();
    const users = z.array(UserInfoSchema).parse(rawData);
    return users;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function deleteUser(userId: UserId) {
  try {
    const response = await fetchFromServer(`/users/${userId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
