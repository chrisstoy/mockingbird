import { z } from 'zod';

export type Password = string & { __type: 'password' };

export const PasswordSchema = z.custom<Password>().superRefine((val, ctx) => {
  if (typeof val !== 'string') {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: typeof val,
      message: 'must be a string',
      fatal: true,
    });
    return z.NEVER;
  }
  if (val.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      type: 'string',
      minimum: 8,
      inclusive: true,
      message: 'Password is too short',
      fatal: true,
    });
    return z.NEVER;
  }

  if (val.length > 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      type: 'string',
      maximum: 20,
      inclusive: true,
      message: 'Password is too long',
      fatal: true,
    });
    return z.NEVER;
  }
});
