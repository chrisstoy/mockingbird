import { prisma } from '@/_server/db';
import {
  Document,
  DocumentId,
  DocumentSchema,
  DocumentType,
  UserId,
} from '@/_types';
import { z } from 'zod';
import baseLogger from './logger';

const logger = baseLogger.child({
  service: 'documents:service',
});

export async function getAllDocumentsOfType(
  docType: DocumentType
): Promise<Array<Document>> {
  logger.info(`Getting all documents of type: ${docType}`);

  const rawData = await prisma.document.findMany({
    where: {
      type: docType,
    },
    orderBy: {
      version: 'desc',
    },
  });

  const docs = z.array(DocumentSchema).parse(rawData);
  return docs;
}

export async function getVersionOfDocument(
  docType: DocumentType,
  version: number
) {
  logger.info(`Getting document version ${version} of type: ${docType}`);

  const rawData = await prisma.document.findFirst({
    where: {
      type: docType,
      version,
    },
  });

  if (!rawData) {
    return undefined;
  }

  const docs = DocumentSchema.parse(rawData);
  return docs;
}

export async function getLatestVersionOfDocument(
  docType: DocumentType
): Promise<Document | undefined> {
  logger.info(`Getting latest version of document type: ${docType}`);

  const rawData = await prisma.document.findMany({
    where: {
      type: docType,
    },
    orderBy: {
      version: 'desc',
    },
    take: 1,
  });

  if (!rawData) {
    return undefined;
  }

  const doc = z.array(DocumentSchema).parse(rawData).at(0);

  return doc;
}

export async function createDocument(
  creatorId: UserId,
  docType: DocumentType,
  content: string
) {
  const latestVersion = await getLatestVersionOfDocument(docType);
  const version = latestVersion ? latestVersion.version + 1 : 1;
  logger.info(`Creating document of type: ${docType} with version: ${version}`);

  const rawData = await prisma.document.create({
    data: {
      type: docType,
      content,
      creatorId,
      version,
    },
  });

  const doc = DocumentSchema.parse(rawData);
  return doc;
}

export async function deleteDocument(docType: DocumentType, docId: DocumentId) {
  logger.info(`Deleting document with id: ${docId} of type: ${docType}`);

  const rawData = await prisma.document.delete({
    where: {
      type: docType,
      id: docId,
    },
  });

  const doc = DocumentSchema.parse(rawData);
  return doc;
}
