-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expires" DATETIME NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Passwords" (
    "userId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "albumId" TEXT,
    CONSTRAINT "Image_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "actorId" TEXT,
    "actorURI" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "actorId" TEXT NOT NULL,
    "preferredUsername" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "icon" TEXT,
    CONSTRAINT "Actor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Followers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "actorURI" TEXT NOT NULL,
    "followerURI" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Following" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "actorURI" TEXT NOT NULL,
    "follingURI" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" DATETIME NOT NULL,
    "url" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "attributedTo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Audience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "audienceType" TEXT NOT NULL,
    "audienceUri" TEXT NOT NULL,
    CONSTRAINT "Audience_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" BIGINT,
    CONSTRAINT "Attachment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "NoteTag" (
    "noteId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "href" TEXT,

    PRIMARY KEY ("noteId", "tagId"),
    CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Passwords_userId_key" ON "Passwords"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_activityId_key" ON "Note"("activityId");

-- CreateIndex
CREATE INDEX "Note_published_idx" ON "Note"("published");

-- CreateIndex
CREATE INDEX "Note_activityId_idx" ON "Note"("activityId");

-- CreateIndex
CREATE INDEX "Note_attributedTo_idx" ON "Note"("attributedTo");

-- CreateIndex
CREATE INDEX "Audience_noteId_audienceType_idx" ON "Audience"("noteId", "audienceType");

-- CreateIndex
CREATE INDEX "Attachment_noteId_idx" ON "Attachment"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_type_key" ON "Tag"("name", "type");

-- CreateIndex
CREATE INDEX "NoteTag_tagId_idx" ON "NoteTag"("tagId");
