CREATE TABLE IF NOT EXISTS "Profile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "avatarImagePath" TEXT NOT NULL,
  "avatarPromptJson" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StoryCard" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "levelId" TEXT NOT NULL,
  "themeKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "reflection" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "mediaPathOrUrl" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "StoryCard_levelId_createdAt_idx" ON "StoryCard"("levelId", "createdAt");

CREATE TABLE IF NOT EXISTS "OwnerSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "OwnerSession_token_key" ON "OwnerSession"("token");
