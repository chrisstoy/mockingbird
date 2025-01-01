import { z, ZodIssueCode } from 'zod';

/**
 * A non-empty array
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Create the typed Zod schema for a database Id
 */
export function createDatabaseIdSchema<_T>() {
  return z.custom<_T>().superRefine((val, ctx) => {
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

    if (val.length < 10 || val.length > 255) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'invalid id',
        fatal: true,
      });
      return z.NEVER;
    }
  });
}
