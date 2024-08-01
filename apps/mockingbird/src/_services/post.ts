export interface Post {
  id: string; // uuid
  createdAt: Date; // date/time post was created
  posterId: string; // user that created this post
  responseToPostId?: string; // id of post this is a response to
  content: string; // content of post (markdown?)
  likeCount: number; // number of times this post has been liked
  dislikeCount: number; // number of times this post has been disliked:}
}

export async function createPost(
  userId: string,
  content: string
): Promise<Post> {
  const response = await fetch('http://localhost:3000/api/feed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      posterId: userId,
      content,
    }),
  });
  return response.json();
}
