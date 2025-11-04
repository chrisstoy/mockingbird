-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "audience" "Audience" NOT NULL DEFAULT 'PUBLIC';
