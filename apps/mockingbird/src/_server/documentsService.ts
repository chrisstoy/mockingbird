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

export async function getDocumentById(docId: DocumentId) {
  logger.info(`Getting document with id: ${docId}`);

  const rawData = await prisma.document.findUnique({
    where: {
      id: docId,
    },
  });

  if (!rawData) {
    return undefined;
  }

  const doc = DocumentSchema.parse(rawData);
  return doc;
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

  const doc = DocumentSchema.parse(rawData);
  return doc;
}

export async function getLatestVersionOfDocument(
  docType: DocumentType
): Promise<Document | undefined> {
  logger.info(`Getting latest version of document type: ${docType}`);

  const rawData = await prisma.document.findFirst({
    where: {
      type: docType,
    },
    orderBy: {
      version: 'desc',
    },
  });

  if (!rawData) {
    return undefined;
  }

  const doc = DocumentSchema.parse(rawData);
  return doc;
}

export async function createDocument(
  creatorId: UserId,
  docType: DocumentType,
  content: string
): Promise<Document> {
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

export async function deleteDocument(docId: DocumentId): Promise<Document> {
  logger.info(`Deleting document with id: ${docId}`);

  const rawData = await prisma.document.delete({
    where: {
      id: docId,
    },
  });

  const doc = DocumentSchema.parse(rawData);
  return doc;
}
