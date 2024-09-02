import { API_URL } from '@/../env.mjs';

export async function getUser(id: string) {
  try {
    const response = await fetch(`${API_URL}/users/${id}`);
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
