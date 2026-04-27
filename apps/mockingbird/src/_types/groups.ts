import { z } from 'zod';
import { GroupIdSchema, UserIdSchema } from './ids';

export { GroupIdSchema };

export const GroupVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);
export type GroupVisibility = z.infer<typeof GroupVisibilitySchema>;

export const GroupStatusSchema = z.enum(['ACTIVE', 'DISABLED']);
export type GroupStatus = z.infer<typeof GroupStatusSchema>;

export const GroupRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'LURKER']);
export type GroupRole = z.infer<typeof GroupRoleSchema>;

export const GroupInviteStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED']);
export type GroupInviteStatus = z.infer<typeof GroupInviteStatusSchema>;

export const GroupJoinRequestStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED']);
export type GroupJoinRequestStatus = z.infer<typeof GroupJoinRequestStatusSchema>;

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: GroupVisibilitySchema,
});
export type CreateGroup = z.infer<typeof CreateGroupSchema>;

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  visibility: GroupVisibilitySchema.optional(),
  status: GroupStatusSchema.optional(),
});
export type UpdateGroup = z.infer<typeof UpdateGroupSchema>;

export const GroupSchema = z.object({
  id: GroupIdSchema,
  name: z.string(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  visibility: GroupVisibilitySchema,
  status: GroupStatusSchema,
  ownerId: UserIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Group = z.infer<typeof GroupSchema>;

export const GroupMemberSchema = z.object({
  id: z.string(),
  groupId: GroupIdSchema,
  userId: UserIdSchema,
  role: GroupRoleSchema,
  joinedAt: z.coerce.date(),
});
export type GroupMember = z.infer<typeof GroupMemberSchema>;

export const GroupAuditLogActionSchema = z.enum([
  'member.joined',
  'member.left',
  'member.removed',
  'member.role_changed',
  'invite.sent',
  'invite.accepted',
  'invite.declined',
  'request.sent',
  'request.accepted',
  'request.declined',
  'post.removed',
  'group.name_changed',
  'group.description_changed',
  'group.avatar_changed',
  'group.visibility_changed',
  'group.status_changed',
  'group.ownership_transferred',
  'group.deleted',
]);
export type GroupAuditLogAction = z.infer<typeof GroupAuditLogActionSchema>;
