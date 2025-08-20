import {
  createDocument,
  getAllDocumentsOfType,
} from '@/_server/documentsService';
import baseLogger from '@/_server/logger';
import { DocumentTypeSchema } from '@/_types';
import { RouteContext } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { respondWithError, ResponseError } from '../../errors';
import { validateAuthentication } from '../../validateAuthentication';

const logger = baseLogger.child({
  service: 'api:documents:doctype',
});

const ParamsSchema = z.object({
  docType: DocumentTypeSchema,
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { docType } = ParamsSchema.parse(await context.params);

    logger.info(`Getting document of type: ${docType}`);

    const doc = await getAllDocumentsOfType(docType);
    if (!doc) {
      throw new ResponseError(404, `No documents found for type: ${docType}`);
    }

    return NextResponse.json(doc, { status: 200 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}

/**
 * Add a new instance of a Document of a specific type.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await validateAuthentication();

    const { docType } = ParamsSchema.parse(await context.params);

    const formData = await req.formData();

    const fileBlob = formData.get('file');
    const file = fileBlob instanceof File ? fileBlob : undefined;

    const schema = z.object({
      file: z.instanceof(File).nullish().optional(),
      content: z.string().nullish().optional(),
    });

    const fd = schema.parse({
      file,
      content: formData.get('content'),
    });

    let content = fd.content;

    if (fd.file) {
      const originalBuffer = Buffer.from(await fd.file.arrayBuffer());
      const fileContents = originalBuffer.toString('utf-8');
      content = fileContents;
    }

    if (!content) {
      throw new ResponseError(400, 'Content is required for the document');
    }

    const doc = await createDocument(session.user.id, docType, content);

    logger.info(
      `Created document: {${{
        docType,
        version: doc.version,
        creatorId: session.user.id,
      }}}`
    );

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    logger.error(error);
    return respondWithError(error);
  }
}
