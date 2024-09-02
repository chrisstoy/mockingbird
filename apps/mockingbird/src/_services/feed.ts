import { apiUrlFor } from './api';

export async function getFeed() {
  const response = await fetch(await apiUrlFor('/feed'), {
    next: { tags: ['feed'] },
  });
  const posts = await response.json();

  return posts;
}
