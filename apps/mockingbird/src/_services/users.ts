export async function getUser(id: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${id}`);
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
