-- CreateTable
CREATE TABLE "Friends" (
    "userId" STRING NOT NULL,
    "friendId" STRING NOT NULL,
    "accepted" BOOL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("userId")
);
