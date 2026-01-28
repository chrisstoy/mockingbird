jest.mock('@/_server/db', () => ({
  prisma: {
    document: {
      findFirst: jest.fn(),
    },
  },
}));

// @ts-expect-error - expect import error message
import { prisma } from '@/_server/db';
// @ts-expect-error - expect import error message
import { DocumentId } from '@/_types';
import { requireAcceptToS } from '../requireAcceptToS';

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

const mockDocumentId: DocumentId = 'cmdwicgez00009r2datfy8g4v';
const oldMockDocumentId: DocumentId = 'cmdwicgez00009r2datfy8g4v-old';

const documentFindFirstMock = prisma.document.findFirst as jest.Mock;

describe('requireAcceptToS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns requireAcceptance=true and newTOS=false if user has not accepted ToS', async () => {
    documentFindFirstMock.mockResolvedValue(createMockToS(mockDocumentId));

    const result = await requireAcceptToS(undefined);

    expect(result).toEqual({
      requireAcceptance: true,
      newTOS: false,
    });
  });

  it('returns requireAcceptance=false and newTOS=false if user has accepted latest ToS', async () => {
    documentFindFirstMock.mockResolvedValue(createMockToS(mockDocumentId));

    const result = await requireAcceptToS(mockDocumentId);

    expect(result).toEqual({
      requireAcceptance: false,
      newTOS: false,
    });
  });

  it('returns requireAcceptance=true and newTOS=true if user accepted old ToS', async () => {
    documentFindFirstMock.mockResolvedValue(createMockToS(mockDocumentId));

    const result = await requireAcceptToS(oldMockDocumentId);

    expect(result).toEqual({
      requireAcceptance: true,
      newTOS: true,
    });
  });

  it('throws error if ToS document not found or fails validation', async () => {
    documentFindFirstMock.mockResolvedValue(undefined);

    await expect(requireAcceptToS(oldMockDocumentId)).rejects.toThrow(
      /Error finding or parsing latest ToS Document/
    );
  });
});
