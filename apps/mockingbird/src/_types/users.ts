import { z, ZodIssueCode } from 'zod';
import { createDatabaseIdSchema } from './type-utilities';

export type UserId = string & { __brand: 'UserId' };
export const UserIdSchema = createDatabaseIdSchema<UserId>();

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

export const SimpleUserInfoSchema = z.object({
  id: UserIdSchema,
  name: z.string(),
  image: z.string().optional().nullable(),
});
export type SimpleUserInfo = z.infer<typeof SimpleUserInfoSchema>;

export const UserInfoSchema = SimpleUserInfoSchema.extend({
  emailVerified: z.coerce.date().optional().nullable(),
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
  image: z.string().optional().nullable(),
  email: EmailAddressSchema,
});

/**
 * A strongly typed version of the User type from AuthJS
 */
export type SessionUser = z.infer<typeof SessionUserSchema>;
