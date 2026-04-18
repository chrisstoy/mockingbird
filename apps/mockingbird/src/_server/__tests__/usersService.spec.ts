import { PrismaClient } from '../../../prisma/generated/client.js';

jest.mock('../../../prisma/generated/client.js', () => ({
  PrismaClient: jest.fn(),
}));

jest.mock('@/_server/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    post: { deleteMany: jest.fn() },
    friends: { deleteMany: jest.fn() },
    session: { deleteMany: jest.fn() },
    account: { deleteMany: jest.fn() },
    passwords: { delete: jest.fn() },
    user: { delete: jest.fn() },
  } as unknown as Partial<PrismaClient>,
}));

jest.mock('@/_server/logger', () => ({
  child: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('@/_server/imagesService', () => ({
  deleteAllImagesForUser: jest.fn(),
}));

jest.mock('@/_server/emailService', () => ({
  sendEmailVerificationEmail: jest.fn(),
}));

// @ts-expect-error - mock import
import { prisma } from '@/_server/db';
import { deleteAllImagesForUser } from '@/_server/imagesService';
import { deleteUser } from '../usersService';

const transactionMock = jest.mocked(prisma.$transaction);
const deleteAllImagesForUserMock = jest.mocked(deleteAllImagesForUser);

beforeEach(() => {
  jest.clearAllMocks();
  transactionMock.mockResolvedValue([
    { count: 0 }, // comments
    { count: 1 }, // posts
    { count: 0 }, // friendships
    { count: 0 }, // sessions
    { count: 0 }, // accounts
    {}, // password
    {}, // user
  ]);
  deleteAllImagesForUserMock.mockResolvedValue(undefined);
});

describe('deleteUser', () => {
  it('deletes all images before deleting the user', async () => {
    let imagesDeletedAt: number | undefined;
    let transactionCalledAt: number | undefined;
    let callOrder = 0;

    deleteAllImagesForUserMock.mockImplementation(async () => {
      imagesDeletedAt = ++callOrder;
    });
    transactionMock.mockImplementation(async () => {
      transactionCalledAt = ++callOrder;
      return [];
    });

    await deleteUser('user-1');

    expect(imagesDeletedAt).toBeDefined();
    expect(transactionCalledAt).toBeDefined();
    expect(imagesDeletedAt!).toBeLessThan(transactionCalledAt!);
  });

  it('calls deleteAllImagesForUser with the correct userId', async () => {
    await deleteUser('user-abc');
    expect(deleteAllImagesForUserMock).toHaveBeenCalledWith('user-abc');
  });

  it('propagates errors from deleteAllImagesForUser', async () => {
    deleteAllImagesForUserMock.mockRejectedValue(new Error('R2 failure'));
    await expect(deleteUser('user-1')).rejects.toThrow('R2 failure');
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
