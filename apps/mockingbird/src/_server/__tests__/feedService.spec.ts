jest.mock('@/_server/db', () => ({
  prisma: {
    post: { findMany: jest.fn() },
    groupMember: { findUnique: jest.fn() },
  },
}));
jest.mock('@/_server/friendsService', () => ({
  getAcceptedFriendsForUser: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/_server/reactionService', () => ({
  groupPostReactions: jest.fn().mockReturnValue([]),
}));

// @ts-expect-error — jest.mock hoists above import but TS doesn't know the module is mocked
import { prisma } from '@/_server/db';
import { getFeed } from '../feedService';

const groupMemberFindUniqueMock = jest.mocked(prisma.groupMember.findUnique);
const postFindManyMock = jest.mocked(prisma.post.findMany);

const USER_ID = 'cm1750szo00001ocb5aog8ley' as any;
const GROUP_ID = 'cm1srlg8f000014ng4h8nudwi';

describe('getFeed with groupId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns group feed for a member', async () => {
    groupMemberFindUniqueMock.mockResolvedValue({ role: 'MEMBER' } as any);
    postFindManyMock.mockResolvedValue([]);

    const result = await getFeed({ userId: USER_ID, feedSource: GROUP_ID });

    expect(groupMemberFindUniqueMock).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: GROUP_ID, userId: USER_ID } },
    });
    expect(postFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ groupId: GROUP_ID }) })
    );
    expect(result).toEqual([]);
  });

  it('throws if user is not a group member', async () => {
    groupMemberFindUniqueMock.mockResolvedValue(null);
    await expect(getFeed({ userId: USER_ID, feedSource: GROUP_ID })).rejects.toThrow();
  });
});
