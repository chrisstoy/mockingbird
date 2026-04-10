jest.mock('@/_server/db', () => {
  return {
    prisma: {
      friends: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((fn) =>
        fn({
          friends: {
            create: jest.requireMock('@/_server/db').prisma.friends.create,
            findFirst: jest.requireMock('@/_server/db').prisma.friends.findFirst,
          },
        })
      ),
    },
  };
});

jest.mock('@/_server/logger', () => {
  return {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
    }),
  };
});

// @ts-expect-error - expect import error message
import { prisma } from '@/_server/db';
import { requestFriendshipBetweenUsers } from '../friendsService';

const friendsCreateMock = jest.mocked(prisma.friends.create);
const friendsFindFirstMock = jest.mocked(prisma.friends.findFirst);

describe('requestFriendshipBetweenUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return requested friendship with PENDING status', async () => {
    friendsFindFirstMock.mockResolvedValue(null);
    friendsCreateMock.mockResolvedValue({
      id: 'cm1750szo00001ocb5aog8ley',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      status: 'PENDING',
    });

    const result = await requestFriendshipBetweenUsers(
      'cm1750szo00001ocb5aog8ley',
      'cm1srlg8f000014ng4h8nudwi'
    );

    expect(result).toEqual({
      id: 'cm1750szo00001ocb5aog8ley',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      status: 'PENDING',
    });
    expect(friendsCreateMock).toHaveBeenCalledWith({
      data: { userId: 'cm1750szo00001ocb5aog8ley', friendId: 'cm1srlg8f000014ng4h8nudwi', status: 'PENDING' },
    });
  });

  it('should return null if friendship already exists', async () => {
    friendsFindFirstMock.mockResolvedValue({
      id: 'existing',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      status: 'PENDING',
    });

    const result = await requestFriendshipBetweenUsers(
      'cm1750szo00001ocb5aog8ley',
      'cm1srlg8f000014ng4h8nudwi'
    );

    expect(result).toBeNull();
    expect(friendsCreateMock).not.toHaveBeenCalled();
  });
});
