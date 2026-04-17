-- AlterTable: Remove likeCount and dislikeCount from Post
ALTER TABLE "Post" DROP COLUMN "likeCount";
ALTER TABLE "Post" DROP COLUMN "dislikeCount";

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('THUMBS_UP', 'THUMBS_DOWN', 'CHEER', 'ANGER', 'LAUGH', 'HUGS');

-- CreateTable
CREATE TABLE "PostReaction" (
    "postId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "reaction" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
