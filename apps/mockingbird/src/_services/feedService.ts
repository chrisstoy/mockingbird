import { Post } from './post';

export const mockFeed: Post[] = [
  {
    id: '1',
    createdAt: new Date(),
    posterId: 'test-user-1',
    content: 'Test Post 1',
    likeCount: 0,
    dislikeCount: 0,
  },
  {
    id: '2',
    createdAt: new Date(),
    posterId: 'test-user-2',
    content: 'Test Post 2',
    likeCount: 0,
    dislikeCount: 0,
  },
];
