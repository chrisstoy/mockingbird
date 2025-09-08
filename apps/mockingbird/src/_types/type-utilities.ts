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

/**
 * A Zod schema that strictly parses boolean values.
 *
 * Accepts:
 * - Boolean values (`true`, `false`)
 * - String representations (`'true'`, `'false'`, `'1'`, `'0'`)
 *
 * Any other value will result in a validation error.
 *
 * @example
 * StrictBooleanSchema.parse(true); // true
 * StrictBooleanSchema.parse('false'); // false
 * StrictBooleanSchema.parse('1'); // true
 * StrictBooleanSchema.parse('0'); // false
 *
 * @see https://zod.dev/?id=preprocess
 */
export const StrictBooleanSchema = z.preprocess((val) => {
  // Coerce booleans directly
  if (typeof val === 'boolean') {
    return val;
  }
  // Check for specific strings
  if (val === 'true' || val === '1') {
    return true;
  }
  if (val === 'false' || val === '0') {
    return false;
  }
  // Otherwise, return the value to let Zod handle the error
  return val;
}, z.boolean());
