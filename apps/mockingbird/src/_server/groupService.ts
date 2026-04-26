import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import {
  CreateGroup,
  GroupId,
  GroupRole,
  GroupSchema,
  GroupMemberSchema,
  GroupAuditLogAction,
  UpdateGroup,
  UserId,
} from '@/_types';

const logger = baseLogger.child({ service: 'group:service' });

export async function createGroup(ownerId: UserId, data: CreateGroup) {
  const group = await prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      visibility: data.visibility,
      ownerId,
    },
  });

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: ownerId, role: 'OWNER' },
  });

  logger.info(`Created group id=${group.id} owner=${ownerId}`);
  return GroupSchema.parse(group);
}

export async function getGroupById(groupId: GroupId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return null;
  return GroupSchema.parse(group);
}

export async function searchGroups(query: string) {
  const groups = await prisma.group.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    take: 50,
    orderBy: { name: 'asc' },
  });
  return groups.map((g) => GroupSchema.parse(g));
}

export async function updateGroup(groupId: GroupId, data: UpdateGroup) {
  const group = await prisma.group.update({
    where: { id: groupId },
    data,
  });
  return GroupSchema.parse(group);
}

export async function deleteGroup(groupId: GroupId) {
  await prisma.group.delete({ where: { id: groupId } });
}

export async function getGroupMemberRole(groupId: GroupId, userId: UserId) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return member?.role ?? null;
}

export async function appendGroupAuditLog(
  groupId: GroupId,
  actorId: UserId,
  action: GroupAuditLogAction,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.groupAuditLog.create({
    data: {
      groupId,
      actorId,
      action,
      targetId,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}

export async function getGroupMembers(groupId: GroupId) {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function addGroupMember(groupId: GroupId, userId: UserId, role: GroupRole = 'MEMBER') {
  const member = await prisma.groupMember.create({
    data: { groupId, userId, role },
  });
  return GroupMemberSchema.parse(member);
}

export async function removeGroupMember(groupId: GroupId, userId: UserId) {
  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function changeGroupMemberRole(groupId: GroupId, userId: UserId, role: GroupRole) {
  const member = await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { role },
  });
  return GroupMemberSchema.parse(member);
}

export async function transferGroupOwnership(
  groupId: GroupId,
  currentOwnerId: UserId,
  newOwnerId: UserId
) {
  await prisma.$transaction(async (tx) => {
    await tx.group.update({ where: { id: groupId }, data: { ownerId: newOwnerId } });
    await tx.groupMember.update({
      where: { groupId_userId: { groupId, userId: currentOwnerId } },
      data: { role: 'ADMIN' },
    });
    await tx.groupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerId } },
      data: { role: 'OWNER' },
    });
  });
}

export async function exportGroupPosts(groupId: GroupId) {
  return prisma.post.findMany({
    where: { groupId, responseToPostId: null },
    orderBy: { createdAt: 'asc' },
    include: {
      poster: { select: { id: true, name: true } },
      responses: {
        orderBy: { createdAt: 'asc' },
        include: { poster: { select: { id: true, name: true } } },
      },
      reactions: true,
    },
  });
}

export async function createGroupInvite(
  groupId: GroupId,
  invitedByUserId: UserId,
  invitedUserId: UserId
) {
  return prisma.groupInvite.create({
    data: { groupId, invitedByUserId, invitedUserId, status: 'PENDING' },
  });
}

export async function updateGroupInviteStatus(inviteId: string, status: 'ACCEPTED' | 'DECLINED') {
  return prisma.groupInvite.update({ where: { id: inviteId }, data: { status } });
}

export async function getGroupInvite(inviteId: string) {
  return prisma.groupInvite.findUnique({ where: { id: inviteId } });
}

export async function createGroupJoinRequest(groupId: GroupId, userId: UserId) {
  return prisma.groupJoinRequest.create({
    data: { groupId, userId, status: 'PENDING' },
  });
}

export async function updateGroupJoinRequestStatus(
  requestId: string,
  status: 'ACCEPTED' | 'DECLINED'
) {
  return prisma.groupJoinRequest.update({ where: { id: requestId }, data: { status } });
}

export async function getGroupJoinRequest(requestId: string) {
  return prisma.groupJoinRequest.findUnique({ where: { id: requestId } });
}

export async function getPendingJoinRequests(groupId: GroupId) {
  return prisma.groupJoinRequest.findMany({
    where: { groupId, status: 'PENDING' },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getPendingInvitesForGroup(groupId: GroupId) {
  return prisma.groupInvite.findMany({
    where: { groupId, status: 'PENDING' },
    include: { invitedUser: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getGroupAuditLog(groupId: GroupId, cursor?: string) {
  return prisma.groupAuditLog.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}
