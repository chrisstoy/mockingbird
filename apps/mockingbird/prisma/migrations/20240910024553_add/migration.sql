/*
  Warnings:

  - The required column `id` was added to the `Friends` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Friends" ADD COLUMN     "id" STRING NOT NULL;

-- AlterPrimaryKey
ALTER TABLE "Friends" ALTER PRIMARY KEY USING COLUMNS ("id");

-- CreateTable
CREATE TABLE "Passwords" (
    "userId" STRING NOT NULL,
    "password" STRING NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Passwords_userId_key" ON "Passwords"("userId");

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
