import { apiUrlFor } from './api';

export async function getUser(id: string) {
  try {
    const response = await fetch(await apiUrlFor(`/users/${id}`));
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
