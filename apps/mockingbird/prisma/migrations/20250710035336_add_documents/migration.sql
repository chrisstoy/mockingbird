-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TOC', 'PRIVACY');

-- CreateTable
CREATE TABLE "Document" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "DocumentType" NOT NULL,
    "creatorId" STRING NOT NULL;
    "version" INT4 NOT NULL,
    "content" STRING NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
