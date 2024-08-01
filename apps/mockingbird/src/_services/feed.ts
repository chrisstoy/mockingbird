export async function getFeed() {
  const response = await fetch('http://localhost:3000/api/feed', {
    next: { tags: ['feed'] },
  });
  const posts = await response.json();

  return posts;
}
