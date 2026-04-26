import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { NotificationType, UserId } from '@/_types';

const logger = baseLogger.child({ service: 'notification:service' });

type CreateNotificationParams = {
  userId: UserId;
  type: NotificationType;
  actorId?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      actorId: params.actorId,
      entityId: params.entityId,
      metadata: params.metadata ? (params.metadata as object) : undefined,
      read: false,
    },
  });
  logger.info(`Created notification type=${params.type} for userId=${params.userId}`);
}

export async function getNotificationsForUser(userId: UserId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadNotificationCount(userId: UserId): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: UserId): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
