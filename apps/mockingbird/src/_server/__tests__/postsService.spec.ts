import { PrismaClient } from '../../../prisma/generated/client.js';

jest.mock('@/_server/db', () => {
  return {
    prisma: {
      post: {
        create: jest.fn(),
      } as Partial<PrismaClient['post']>,
    },
  };
});

jest.mock('@/_server/logger', () => {
  return {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
    }),
  };
});

// @ts-expect-error - expect import error message
import { prisma } from '@/_server/db';
import { createPost } from '../postsService';

const postsCreateMock = jest.mocked<PrismaClient['post']['create']>(
  prisma.post.create
);

describe('createPost', () => {
  beforeAll(() => {
    postsCreateMock.mockImplementation(({ data }) => {
      return Promise.resolve({
        id: 'cm5t7b2da0001nkm167ecyq58',
        createdAt: '2025-01-12T05:55:14.481Z',
        updatedAt: '2025-01-12T05:55:14.481Z',
        likeCount: 0,
        dislikeCount: 0,

        posterId: data.posterId,
        audience: data.audience,
        content: data.content,
        responseToPostId: data.responseToPostId,
        imageId: data.imageId,
      });
    });
  });

  it('should return new Post', async () => {
    const result = await createPost(
      'mock-poster-id-1',
      'PUBLIC',
      'This is mock content'
    );

    expect(result).toEqual(
      expect.objectContaining({
        posterId: 'mock-poster-id-1',
        content: 'This is mock content',
        responseToPostId: undefined,
      })
    );
  });

  it('should fail if no content is provided', async () => {
    await expect(createPost('mock-poster-id-1', 'PUBLIC', '')).rejects.toThrow(
      'createPost: content: No Content'
    );
  });

  it('should fail if any id is invalid', async () => {
    await expect(createPost('', 'PUBLIC', 'mock content')).rejects.toThrow(
      'createPost: posterId: invalid id'
    );

    await expect(
      createPost('mock-poster-id-1', 'PUBLIC', 'mock content', '')
    ).rejects.toThrow('createPost: responseToPostId: invalid id');
  });
});
