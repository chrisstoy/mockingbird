import { getLatestVersionOfDocument } from '@/_server/documentsService';
import baseLogger from '@/_server/logger';
import { DocumentTypeSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../errors';

const logger = baseLogger.child({
  service: 'api:documents:doctype:latest',
});

const ParamsSchema = z.object({
  docType: DocumentTypeSchema,
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { docType } = ParamsSchema.parse(await context.params);

    logger.info(`Getting latest document of type: ${docType}`);

    const doc = await getLatestVersionOfDocument(docType);
    if (!doc) {
      throw new ResponseError(
        404,
        `Latest document not found for type: ${docType}`
      );
    }

    return NextResponse.json(doc, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
