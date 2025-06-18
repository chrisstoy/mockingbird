import { Audience as DBAudience } from '@prisma/client';
import { z, ZodIssueCode } from 'zod';

export const audienceValues = Object.values(DBAudience);
export type Audience = (typeof DBAudience)[keyof typeof DBAudience];

export const AudienceSchema = z.custom<Audience>().superRefine((val, ctx) => {
  if (!audienceValues.includes(val)) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: 'invalid audience',
      fatal: true,
    });
    return z.NEVER;
  }
});
