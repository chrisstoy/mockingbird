import { API_URL } from '@/../env.mjs';

export async function getFeed() {
  const response = await fetch(`${API_URL}/feed`, {
    next: { tags: ['feed'] },
  });
  const posts = await response.json();

  return posts;
}
