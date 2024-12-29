import { z, ZodIssueCode } from 'zod';
import { createDatabaseIdSchema } from './type-utilities';

export type UserId = string & { __brand: 'UserId' };
export const UserIdSchema = createDatabaseIdSchema<UserId>();

export interface UserInfo {
  id: UserId;
  name: string;
  image?: string | null;
}

export const UserInfoSchema = z.object({
  id: UserIdSchema,
  name: z.string(),
  image: z.string().optional().nullable(),
});

export type FriendStatus = 'friend' | 'pending' | 'requested' | 'none';

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

export const AuthUserSchema = UserInfoSchema.extend({
  email: EmailAddressSchema,
});

/**
 * A more strongly typed version of the User type from next-auth
 */
export type AuthUser = z.infer<typeof AuthUserSchema>;
