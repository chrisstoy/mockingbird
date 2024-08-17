export interface Post {
  id: string; // uuid
  createdAt: Date;
  updatedAt: Date;

  posterId: string; // user that created this post
  responseToPostId?: string; // id of post this is a response to
  content: string; // content of post (markdown?)
  likeCount: number; // number of times this post has been liked
  dislikeCount: number; // number of times this post has been disliked:}
}
