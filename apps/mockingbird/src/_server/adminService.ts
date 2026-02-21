import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { UserRole } from '@/_types';
import { UserId } from '@/_types/ids';
import { Prisma } from '../../prisma/generated/client.js';
import { env } from '@/../env';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const logger = baseLogger.child({ service: 'admin:service' });

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

export async function getAllUsers(
  page: number,
  limit: number,
  query?: string
) {
  logger.info(`getAllUsers page=${page} limit=${limit} query=${query}`);
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

export async function suspendUser(userId: string, actorId: string) {
  logger.info(`suspendUser userId=${userId} actorId=${actorId}`);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: 'SUSPENDED' },
  });
  await logAdminAction(actorId, 'SUSPEND_USER', userId);
  return user;
}

export async function unsuspendUser(userId: string, actorId: string) {
  logger.info(`unsuspendUser userId=${userId} actorId=${actorId}`);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  });
  await logAdminAction(actorId, 'UNSUSPEND_USER', userId);
  return user;
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
  actorId: string
) {
  logger.info(`updateUserRole userId=${userId} role=${role} actorId=${actorId}`);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  await logAdminAction(actorId, 'UPDATE_ROLE', userId, { role });
  return user;
}

export async function getUserPermissionOverrides(userId: string) {
  return prisma.userPermission.findMany({ where: { userId } });
}

export async function setUserPermissionOverrides(
  userId: string,
  overrides: { permission: string; granted: boolean }[],
  actorId: string
) {
  logger.info(`setUserPermissionOverrides userId=${userId} actorId=${actorId}`);

  await prisma.$transaction(async (tx) => {
    await tx.userPermission.deleteMany({ where: { userId } });
    if (overrides.length > 0) {
      await tx.userPermission.createMany({
        data: overrides.map((o) => ({ userId, ...o })),
      });
    }
  });

  await logAdminAction(actorId, 'SET_PERMISSIONS', userId, { overrides });
}

export async function adminDeleteUser(userId: UserId, actorId: string) {
  logger.info(`adminDeleteUser userId=${userId} actorId=${actorId}`);

  await prisma.$transaction([
    prisma.post.deleteMany({
      where: {
        responseToPostId: { not: null },
        responseTo: { posterId: userId },
      },
    }),
    prisma.post.deleteMany({ where: { posterId: userId } }),
    prisma.friends.deleteMany({
      where: { OR: [{ userId }, { friendId: userId }] },
    }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.userPermission.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  await logAdminAction(actorId, 'DELETE_USER', userId);
}

// ---------------------------------------------------------------------------
// Content moderation
// ---------------------------------------------------------------------------

export async function getAllPostsForModeration(page: number, limit: number) {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { poster: { select: { id: true, name: true } } },
    }),
    prisma.post.count(),
  ]);
  return { posts, total, page, limit };
}

// ---------------------------------------------------------------------------
// Log reading
// ---------------------------------------------------------------------------

export async function readLogEntries(options?: {
  date?: string;
  level?: string;
  page?: number;
  limit?: number;
}) {
  const { date, level, page = 1, limit = 50 } = options ?? {};
  const logDir = env.LOG_DIR ?? './logs';

  let lines: string[] = [];
  try {
    const files = await readdir(logDir);
    const targetFiles = date
      ? files.filter((f) => f.includes(date))
      : files.filter((f) => f.endsWith('.log'));
    targetFiles.sort().reverse();

    for (const file of targetFiles.slice(0, 3)) {
      const content = await readFile(join(logDir, file), 'utf-8');
      lines.push(...content.split('\n').filter(Boolean));
    }
  } catch {
    lines = [];
  }

  if (level) {
    lines = lines.filter((l) => {
      try {
        return JSON.parse(l).level === level;
      } catch {
        return false;
      }
    });
  }

  lines.reverse();
  const total = lines.length;
  const start = (page - 1) * limit;
  const entries = lines.slice(start, start + limit).map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return { message: l };
    }
  });

  return { entries, total, page, limit };
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export async function logAdminAction(
  actorId: string,
  action: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.adminAuditLog.create({
    data: {
      actorId,
      action,
      targetId,
      metadata: (metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

export async function getAuditLog(page: number, limit: number) {
  const [entries, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminAuditLog.count(),
  ]);
  return { entries, total, page, limit };
}
