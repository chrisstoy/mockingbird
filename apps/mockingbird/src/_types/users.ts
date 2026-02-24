import { z, ZodIssueCode } from 'zod';
import { DocumentIdSchema, UserIdSchema } from './ids';

export type EmailAddress = string & { __brand: 'EmailAddress' };
export const EmailAddressSchema = z
  .custom<EmailAddress>()
  .superRefine((val, ctx) => {
    if (typeof val !== 'string') {
      ctx.addIssue({
        code: ZodIssueCode.invalid_type,
        expected: 'string',
        received: typeof val,
        message: 'must be a string',
        fatal: true,
      });
      return z.NEVER;
    }

    if (!val.match(/^\S+@\S+\.\S+$/)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'invalid email address',
        fatal: true,
      });
      return z.NEVER;
    }
  });

export const UserRoleSchema = z.enum([
  'USER',
  'MODERATOR',
  'EDITOR',
  'SUPER_ADMIN',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const SimpleUserInfoSchema = z.object({
  id: UserIdSchema,
  name: z.string(),
  image: z.string().nullish(),
});
export type SimpleUserInfo = z.infer<typeof SimpleUserInfoSchema>;

export const UserInfoSchema = SimpleUserInfoSchema.extend({
  email: EmailAddressSchema,
  emailVerified: z.coerce.date().nullish(),
  acceptedToS: DocumentIdSchema.nullish(),
  role: UserRoleSchema.default('USER'),
  status: UserStatusSchema.default('ACTIVE'),
  suspensionReason: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserInfo = z.infer<typeof UserInfoSchema>;

export type FriendStatus = 'friend' | 'pending' | 'requested' | 'none';

export const FriendCollectionSchema = z.object({
  friends: z.array(SimpleUserInfoSchema),
  pendingFriends: z.array(SimpleUserInfoSchema),
  friendRequests: z.array(SimpleUserInfoSchema),
});
export type FriendCollection = z.infer<typeof FriendCollectionSchema>;

/**
 * Schema used to validate the User info returned from AuthJS
 */
export const SessionUserSchema = z.object({
  id: UserIdSchema,
  name: z.string(),
  image: z.string().nullish(), // url to user's profile image
  email: EmailAddressSchema,
  permissions: z.array(z.string()).default([]),
  status: UserStatusSchema.default('ACTIVE'),
});

/**
 * A strongly typed version of the User type from AuthJS
 */
export type SessionUser = z.infer<typeof SessionUserSchema>;

export const ActiveSessionSchema = z.object({
  user: SessionUserSchema,
  expires: z.string(),
});

export type ActiveSession = z.infer<typeof ActiveSessionSchema>;
