jest.mock('@/_server/db', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/_server/logger', () => ({
  child: jest.fn().mockReturnValue({ info: jest.fn(), error: jest.fn() }),
}));

// @ts-expect-error — jest.mock hoists above import but TS doesn't know the module is mocked
import { prisma } from '@/_server/db';
import {
  createNotification,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../notificationService';
import { NotificationType } from '@/_types';

const notificationCreateMock = jest.mocked(prisma.notification.create);
const notificationFindManyMock = jest.mocked(prisma.notification.findMany);
const notificationCountMock = jest.mocked(prisma.notification.count);
const notificationUpdateMock = jest.mocked(prisma.notification.update);
const notificationUpdateManyMock = jest.mocked(prisma.notification.updateMany);

const USER_ID = 'cm1750szo00001ocb5aog8ley' as any;
const ACTOR_ID = 'cm1srlg8f000014ng4h8nudwi' as any;

describe('createNotification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a notification with required fields', async () => {
    notificationCreateMock.mockResolvedValue({ id: 'notif1' } as any);
    await createNotification({
      userId: USER_ID,
      type: NotificationType.FRIEND_REQUEST,
      actorId: ACTOR_ID,
      entityId: 'entity1',
    });
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_ID,
        type: NotificationType.FRIEND_REQUEST,
        actorId: ACTOR_ID,
        entityId: 'entity1',
        read: false,
      }),
    });
  });
});

describe('getNotificationsForUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches notifications for user ordered by date', async () => {
    notificationFindManyMock.mockResolvedValue([]);
    await getNotificationsForUser(USER_ID);
    expect(notificationFindManyMock).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
});

describe('getUnreadNotificationCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns count of unread notifications', async () => {
    notificationCountMock.mockResolvedValue(3);
    const count = await getUnreadNotificationCount(USER_ID);
    expect(count).toBe(3);
    expect(notificationCountMock).toHaveBeenCalledWith({
      where: { userId: USER_ID, read: false },
    });
  });
});

describe('markNotificationRead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks a notification as read', async () => {
    notificationUpdateMock.mockResolvedValue({} as any);
    await markNotificationRead('notif1');
    expect(notificationUpdateMock).toHaveBeenCalledWith({
      where: { id: 'notif1' },
      data: { read: true },
    });
  });
});

describe('markAllNotificationsRead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks all unread notifications as read for user', async () => {
    notificationUpdateManyMock.mockResolvedValue({ count: 2 } as any);
    await markAllNotificationsRead(USER_ID);
    expect(notificationUpdateManyMock).toHaveBeenCalledWith({
      where: { userId: USER_ID, read: false },
      data: { read: true },
    });
  });
});
