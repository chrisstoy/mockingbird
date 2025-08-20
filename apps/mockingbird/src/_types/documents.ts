import { DocumentType as DBDocumentType } from '@prisma/client';
import { z, ZodIssueCode } from 'zod';
import { DocumentIdSchema, UserIdSchema } from './ids';

export const documentTypeValues = Object.values(DBDocumentType);
export type DocumentType = (typeof DBDocumentType)[keyof typeof DBDocumentType];

export const DocumentTypeSchema = z
  .custom<DocumentType>()
  .superRefine((val, ctx) => {
    if (!documentTypeValues.includes(val)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'invalid DocumentType',
        fatal: true,
      });
      return z.NEVER;
    }
  });

export const DocumentSchema = z.object({
  id: DocumentIdSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  type: DocumentTypeSchema,
  creatorId: UserIdSchema,
  version: z.number(),
  content: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;
