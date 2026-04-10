-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable: add status column with default PENDING
ALTER TABLE "Friends" ADD COLUMN "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill: set status based on old accepted boolean
UPDATE "Friends" SET "status" = 'ACCEPTED' WHERE "accepted" = true;
UPDATE "Friends" SET "status" = 'PENDING' WHERE "accepted" = false;

-- AlterTable: drop old accepted column
ALTER TABLE "Friends" DROP COLUMN "accepted";
