-- CreateTable
CREATE TABLE "Image" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" STRING NOT NULL,
    "imageUrl" STRING NOT NULL,
    "thumbnailUrl" STRING NOT NULL,
    "description" STRING NOT NULL,
    "album" STRING NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
