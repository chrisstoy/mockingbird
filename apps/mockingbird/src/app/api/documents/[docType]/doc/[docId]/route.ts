import { deleteDocument } from '@/_server/documentsService';
import baseLogger from '@/_server/logger';
import { DocumentIdSchema, DocumentTypeSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../../errors';

const logger = baseLogger.child({
  service: 'api:documents:doctype:docId',
});

const ParamsSchema = z.object({
  docType: DocumentTypeSchema,
  docId: DocumentIdSchema,
});

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { success, data, error } = ParamsSchema.safeParse(await context.params);
  if (error) {
    logger.error(`Invalid parameters: ${error.message}`);
    return respondWithError(new ResponseError(400, 'Invalid parameters'));
  }
  const { docType, docId } = data;

  try {
    logger.info(`Deleting document ${docId} of type: ${docType}`);
    await deleteDocument(docId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // Document not found, so successfully does not exist any more
      return new Response(null, { status: 204 });
    }
    logger.error(error);
    return respondWithError(error);
  }
}
