-- CreateTable
CREATE TABLE "Post" (
    "id" STRING NOT NULL,
    "posterId" STRING NOT NULL,
    "responseToPostId" STRING,
    "content" STRING NOT NULL,
    "likeCount" INT4 NOT NULL DEFAULT 0,
    "dislikeCount" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_responseToPostId_fkey" FOREIGN KEY ("responseToPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
