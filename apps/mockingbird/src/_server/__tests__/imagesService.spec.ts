import { PrismaClient } from '../../../prisma/generated/client.js';

jest.mock('../../../prisma/generated/client.js', () => ({
  PrismaClient: jest.fn(),
}));

jest.mock('@/_server/db', () => ({
  prisma: {
    image: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    } as Partial<PrismaClient['image']>,
    album: {
      deleteMany: jest.fn(),
    } as Partial<PrismaClient['album']>,
  },
}));

jest.mock('@/_server/logger', () => ({
  child: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  DeleteObjectCommand: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@/../env', () => ({
  env: {
    CLOUDFLARE_ACCOUNT_ID: 'test-account',
    CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
    CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-key',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret',
    IMAGES_BASE_URL: 'https://images.example.com',
  },
}));

// @ts-expect-error - mock import
import { prisma } from '@/_server/db';
import { deleteAllImagesForUser } from '../imagesService';

const findManyMock = jest.mocked(prisma.image.findMany);
const deleteManyImagesMock = jest.mocked(prisma.image.deleteMany);
const deleteManyAlbumsMock = jest.mocked(prisma.album.deleteMany);

// Retrieve the send mock from the S3Client instance created at module load time.
// mock.results[0].value gives the object returned by the mock constructor.
let s3SendMock: jest.Mock;
beforeAll(() => {
  const { S3Client } = jest.requireMock('@aws-sdk/client-s3') as { S3Client: jest.Mock };
  s3SendMock = (S3Client.mock.results[0].value as { send: jest.Mock }).send;
});

beforeEach(() => {
  findManyMock.mockReset();
  deleteManyImagesMock.mockReset();
  deleteManyAlbumsMock.mockReset();
  s3SendMock?.mockReset();
});

describe('deleteAllImagesForUser', () => {
  it('deletes all R2 objects and DB image records for a user', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'img-1',
        ownerId: 'user-1',
        imageUrl: 'https://images.example.com/user-1/abc.jpg',
        thumbnailUrl: 'https://images.example.com/user-1/thumb-abc.jpg',
        description: '',
        albumId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'img-2',
        ownerId: 'user-1',
        imageUrl: 'https://images.example.com/user-1/def.jpg',
        thumbnailUrl: 'https://images.example.com/user-1/thumb-def.jpg',
        description: '',
        albumId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    // 4 deletes for known images/thumbnails, then list returns empty (no orphans)
    s3SendMock.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // delete img-1
    s3SendMock.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // delete thumb-1
    s3SendMock.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // delete img-2
    s3SendMock.mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // delete thumb-2
    s3SendMock.mockResolvedValueOnce({ Contents: [], IsTruncated: false, $metadata: { httpStatusCode: 200 } }); // orphan list
    deleteManyImagesMock.mockResolvedValue({ count: 2 });
    deleteManyAlbumsMock.mockResolvedValue({ count: 0 });

    await deleteAllImagesForUser('user-1');

    expect(s3SendMock).toHaveBeenCalledTimes(5); // 4 deletes + 1 list
    expect(deleteManyImagesMock).toHaveBeenCalledWith({ where: { ownerId: 'user-1' } });
    expect(deleteManyAlbumsMock).toHaveBeenCalledWith({ where: { ownerId: 'user-1' } });
  });

  it('deletes albums even if user has no images', async () => {
    findManyMock.mockResolvedValue([]);
    s3SendMock.mockResolvedValue({ Contents: [], IsTruncated: false, $metadata: { httpStatusCode: 200 } });
    deleteManyImagesMock.mockResolvedValue({ count: 0 });
    deleteManyAlbumsMock.mockResolvedValue({ count: 1 });

    await deleteAllImagesForUser('user-2');

    expect(s3SendMock).toHaveBeenCalledTimes(1); // orphan list only
    expect(deleteManyImagesMock).toHaveBeenCalledWith({ where: { ownerId: 'user-2' } });
    expect(deleteManyAlbumsMock).toHaveBeenCalledWith({ where: { ownerId: 'user-2' } });
  });

  it('deletes orphaned R2 objects not tracked in the database', async () => {
    findManyMock.mockResolvedValue([]);
    deleteManyImagesMock.mockResolvedValue({ count: 0 });
    deleteManyAlbumsMock.mockResolvedValue({ count: 0 });
    // First call: ListObjectsV2 returns two orphaned objects, not truncated
    s3SendMock.mockResolvedValueOnce({
      Contents: [{ Key: 'user-4/orphan1.jpg' }, { Key: 'user-4/orphan2.jpg' }],
      IsTruncated: false,
      $metadata: { httpStatusCode: 200 },
    });
    // Subsequent calls: DeleteObjectCommand for each orphan
    s3SendMock.mockResolvedValue({ $metadata: { httpStatusCode: 204 } });

    await deleteAllImagesForUser('user-4');

    expect(s3SendMock).toHaveBeenCalledTimes(3); // 1 list + 2 deletes
  });

  it('paginates R2 enumeration when results are truncated', async () => {
    findManyMock.mockResolvedValue([]);
    deleteManyImagesMock.mockResolvedValue({ count: 0 });
    deleteManyAlbumsMock.mockResolvedValue({ count: 0 });
    // Calls interleave: list page 1, delete a.jpg, list page 2, delete b.jpg
    s3SendMock
      .mockResolvedValueOnce({
        Contents: [{ Key: 'user-5/a.jpg' }],
        IsTruncated: true,
        NextContinuationToken: 'token-abc',
        $metadata: { httpStatusCode: 200 },
      })
      .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }) // delete a.jpg
      .mockResolvedValueOnce({
        Contents: [{ Key: 'user-5/b.jpg' }],
        IsTruncated: false,
        $metadata: { httpStatusCode: 200 },
      })
      .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } }); // delete b.jpg

    await deleteAllImagesForUser('user-5');

    expect(s3SendMock).toHaveBeenCalledTimes(4); // 2 lists + 2 deletes
  });

  it('skips R2 deletion for external images (no IMAGES_BASE_URL prefix)', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'img-ext',
        ownerId: 'user-3',
        imageUrl: 'https://external-host.com/photo.jpg',
        thumbnailUrl: 'https://external-host.com/photo.jpg',
        description: '',
        albumId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    s3SendMock.mockResolvedValue({ Contents: [], IsTruncated: false, $metadata: { httpStatusCode: 200 } });
    deleteManyImagesMock.mockResolvedValue({ count: 1 });
    deleteManyAlbumsMock.mockResolvedValue({ count: 0 });

    await deleteAllImagesForUser('user-3');

    expect(s3SendMock).toHaveBeenCalledTimes(1); // orphan list only, no deletes
    expect(deleteManyImagesMock).toHaveBeenCalledWith({ where: { ownerId: 'user-3' } });
  });
});
