import { PrismaClient } from '../../../prisma/generated/client.js';

jest.mock('@/_server/db', () => ({
  prisma: {
    postReaction: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    } as Partial<PrismaClient['postReaction']>,
  },
}));

jest.mock('@/_server/logger', () => ({
  child: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

// @ts-expect-error - mocked module
import { prisma } from '@/_server/db';
import {
  setReaction,
  removeReaction,
  getReactionsForPost,
  groupPostReactions,
} from '../reactionService';

const upsertMock = jest.mocked<PrismaClient['postReaction']['upsert']>(
  prisma.postReaction.upsert
);
const deleteMock = jest.mocked<PrismaClient['postReaction']['delete']>(
  prisma.postReaction.delete
);
const findManyMock = jest.mocked<PrismaClient['postReaction']['findMany']>(
  prisma.postReaction.findMany
);

const mockPostId = 'mock-post-id-000001';
const mockUserId = 'mock-user-id-000001';

describe('groupPostReactions', () => {
  it('groups flat reactions into summaries by type', () => {
    const raw = [
      { userId: 'user-id-000001', reaction: 'THUMBS_UP', user: { id: 'user-id-000001', name: 'Alice', image: null } },
      { userId: 'user-id-000002', reaction: 'THUMBS_UP', user: { id: 'user-id-000002', name: 'Bob', image: 'http://example.com/img.jpg' } },
      { userId: 'user-id-000003', reaction: 'LAUGH', user: { id: 'user-id-000003', name: 'Carol', image: null } },
    ] as Parameters<typeof groupPostReactions>[0];

    const result = groupPostReactions(raw);

    expect(result).toHaveLength(2);

    const thumbsUp = result.find((r) => r.type === 'THUMBS_UP');
    expect(thumbsUp).toBeDefined();
    expect(thumbsUp!.count).toBe(2);
    expect(thumbsUp!.users).toHaveLength(2);

    const laugh = result.find((r) => r.type === 'LAUGH');
    expect(laugh).toBeDefined();
    expect(laugh!.count).toBe(1);
  });

  it('returns empty array for no reactions', () => {
    expect(groupPostReactions([])).toEqual([]);
  });
});

describe('setReaction', () => {
  it('calls upsert with correct args', async () => {
    upsertMock.mockResolvedValueOnce({} as never);

    await setReaction(mockPostId as never, mockUserId as never, 'THUMBS_UP');

    expect(upsertMock).toHaveBeenCalledWith({
      where: { postId_userId: { postId: mockPostId, userId: mockUserId } },
      update: { reaction: 'THUMBS_UP' },
      create: { postId: mockPostId, userId: mockUserId, reaction: 'THUMBS_UP' },
    });
  });
});

describe('removeReaction', () => {
  it('calls delete with correct args', async () => {
    deleteMock.mockResolvedValueOnce({} as never);

    await removeReaction(mockPostId as never, mockUserId as never);

    expect(deleteMock).toHaveBeenCalledWith({
      where: { postId_userId: { postId: mockPostId, userId: mockUserId } },
    });
  });

  it('throws if reaction does not exist', async () => {
    const notFoundError = Object.assign(new Error('Record not found'), {
      code: 'P2025',
    });
    deleteMock.mockRejectedValueOnce(notFoundError as never);

    await expect(
      removeReaction(mockPostId as never, mockUserId as never)
    ).rejects.toThrow();
  });
});

describe('getReactionsForPost', () => {
  it('returns grouped reactions', async () => {
    findManyMock.mockResolvedValueOnce([
      {
        postId: mockPostId,
        userId: 'user-id-000001',
        reaction: 'HUGS',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-id-000001', name: 'Alice', image: null },
      },
    ] as never);

    const result = await getReactionsForPost(mockPostId as never);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('HUGS');
    expect(result[0].count).toBe(1);
  });
});
