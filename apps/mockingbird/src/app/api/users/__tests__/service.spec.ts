jest.mock('@/_server/db', () => {
  return {
    prisma: {
      friends: {
        create: jest.fn(),
      },
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
import { requestFriendshipBetweenUsers } from '../service';

const friendsCreateMock = jest.mocked(prisma.friends.create);

describe('requestFriendshipBetweenUsers', () => {
  it('should return requested friendship', async () => {
    friendsCreateMock.mockResolvedValue({
      id: 'cm1750szo00001ocb5aog8ley',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      accepted: false,
    });

    const result = await requestFriendshipBetweenUsers(
      'cm1750szo00001ocb5aog8ley',
      'cm1srlg8f000014ng4h8nudwi'
    );

    expect(result).toEqual({
      id: 'cm1750szo00001ocb5aog8ley',
      userId: 'cm1750szo00001ocb5aog8ley',
      friendId: 'cm1srlg8f000014ng4h8nudwi',
      accepted: false,
    });
  });
});
