import { getVersionOfDocument } from '@/_server/documentsService';
import baseLogger from '@/_server/logger';
import { DocumentTypeSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../../errors';

const logger = baseLogger.child({
  service: 'api:documents:doctype:version',
});

const ParamsSchema = z.object({
  docType: DocumentTypeSchema,
  version: z.coerce.number(),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { docType, version } = ParamsSchema.parse(await context.params);

    logger.info(`Getting version ${version} document of type: ${docType}`);

    const doc = await getVersionOfDocument(docType, version);
    if (!doc) {
      throw new ResponseError(
        404,
        `Document version ${version} not found for type: ${docType}`
      );
    }

    return NextResponse.json(doc, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
