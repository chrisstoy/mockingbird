jest.mock('@/_server/db', () => ({
  prisma: {
    group: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    groupAuditLog: {
      create: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(jest.requireMock('@/_server/db').prisma)),
  },
}));

jest.mock('@/_server/logger', () => ({
  child: jest.fn().mockReturnValue({ info: jest.fn(), error: jest.fn() }),
}));

// @ts-expect-error — jest.mock hoists above import but TS doesn't know the module is mocked
import { prisma } from '@/_server/db';
import { createGroup, searchGroups } from '../groupService';

const groupCreateMock = jest.mocked(prisma.group.create);
const groupMemberCreateMock = jest.mocked(prisma.groupMember.create);
const groupFindManyMock = jest.mocked(prisma.group.findMany);

const OWNER_ID = 'cm1750szo00001ocb5aog8ley' as any;

describe('createGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates group and adds owner as OWNER member', async () => {
    const mockGroup = {
      id: 'cm1srlg8f000014ng4h8nudwi',
      name: 'Test Flock',
      description: null,
      avatarUrl: null,
      visibility: 'PUBLIC',
      status: 'ACTIVE',
      ownerId: OWNER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    groupCreateMock.mockResolvedValue(mockGroup as any);
    groupMemberCreateMock.mockResolvedValue({} as any);

    const result = await createGroup(OWNER_ID, { name: 'Test Flock', visibility: 'PUBLIC' });

    expect(groupCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Test Flock', ownerId: OWNER_ID }),
    });
    expect(groupMemberCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ groupId: mockGroup.id, userId: OWNER_ID, role: 'OWNER' }),
    });
    expect(result.name).toBe('Test Flock');
  });
});

describe('searchGroups', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns matching groups', async () => {
    groupFindManyMock.mockResolvedValue([]);
    const result = await searchGroups('birds');
    expect(groupFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: 'birds' }),
        }),
      })
    );
    expect(result).toEqual([]);
  });
});
