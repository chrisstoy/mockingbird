jest.mock('@/_server/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
    },
  },
}));

// @ts-expect-error - expect import error message
import { prisma } from '@/_server/db';
// @ts-expect-error - expect import error message
import { DocumentId, UserId, UserInfo } from '@/_types';
import { requireAcceptToS } from '../../requireAcceptToS';

function createMockUserInfo(id: UserId, acceptedToS: DocumentId | null) {
  return {
    id,
    name: 'Mock User',
    image: null,
    email: 'TqR9w@example.com',
    emailVerified: new Date(),
    acceptedToS,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserInfo;
}

function createMockToS(id: DocumentId) {
  return {
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'TOC',
    creatorId: 'cmf3em2qp0003eb2gxx79gixu',
    version: 1,
    content: 'Mock Terms of Service Content',
  };
}

const mockUserId: UserId = 'cmc71p00v000014an9vlaj4fm-123';
const mockDocumentId: DocumentId = 'cmdwicgez00009r2datfy8g4v';

const userFindUniqueMock = prisma.user.findUnique as jest.Mock;
const documentFindFirstMock = prisma.document.findFirst as jest.Mock;

describe('requireAcceptToS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns requireAcceptance=true and newTOS=false if user has not accepted ToS', async () => {
    userFindUniqueMock.mockResolvedValue(createMockUserInfo(mockUserId, null));
    documentFindFirstMock.mockResolvedValue(createMockToS(mockDocumentId));

    const result = await requireAcceptToS(mockUserId);

    expect(result).toEqual({
      requireAcceptance: true,
      newTOS: false,
      userId: mockUserId,
    });
  });

  it('returns requireAcceptance=false and newTOS=false if user has accepted latest ToS', async () => {
    userFindUniqueMock.mockResolvedValue(
      createMockUserInfo(mockUserId, mockDocumentId)
    );
    documentFindFirstMock.mockResolvedValue(createMockToS(mockDocumentId));

    const result = await requireAcceptToS(mockUserId);

    expect(result).toEqual({
      requireAcceptance: false,
      newTOS: false,
      userId: mockUserId,
    });
  });

  it('returns requireAcceptance=false and newTOS=true if user accepted old ToS', async () => {
    userFindUniqueMock.mockResolvedValue(
      createMockUserInfo(mockUserId, 'cmd2fwm220000r9wusv3eesbg')
    );
    documentFindFirstMock.mockResolvedValue(createMockToS(mockDocumentId));

    const result = await requireAcceptToS(mockUserId);

    expect(result).toEqual({
      requireAcceptance: false,
      newTOS: true,
      userId: mockUserId,
    });
  });

  it('throws error if user not found or fails validation', async () => {
    userFindUniqueMock.mockResolvedValue(null);

    await expect(requireAcceptToS(mockUserId)).rejects.toThrow(
      /Error finding or parsing User with id/
    );
  });

  it('throws error if ToS document not found or fails validation', async () => {
    userFindUniqueMock.mockResolvedValue(
      createMockUserInfo(mockUserId, mockDocumentId)
    );
    documentFindFirstMock.mockResolvedValue(undefined);

    await expect(requireAcceptToS(mockUserId)).rejects.toThrow(
      /Error finding or parsing latest ToS Document/
    );
  });
});
