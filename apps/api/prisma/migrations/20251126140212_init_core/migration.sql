/*
  Warnings:

  - You are about to alter the column `metadata` on the `ActivityLog` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `metadata` on the `DriveVersion` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ActivityLog" ("action", "createdAt", "entityId", "entityType", "id", "metadata", "userId") SELECT "action", "createdAt", "entityId", "entityType", "id", "metadata", "userId" FROM "ActivityLog";
DROP TABLE "ActivityLog";
ALTER TABLE "new_ActivityLog" RENAME TO "ActivityLog";
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Document_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("authorId", "content", "createdAt", "id", "title", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "title", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_DriveFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "folderId" TEXT,
    "ownerId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DriveFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DriveFolder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DriveFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DriveFile" ("createdAt", "deleted", "folderId", "id", "name", "ownerId", "size", "type", "updatedAt") SELECT "createdAt", "deleted", "folderId", "id", "name", "ownerId", "size", "type", "updatedAt" FROM "DriveFile";
DROP TABLE "DriveFile";
ALTER TABLE "new_DriveFile" RENAME TO "DriveFile";
CREATE TABLE "new_DriveFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentFolderId" TEXT,
    "ownerId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DriveFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DriveFolder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DriveFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DriveFolder" ("createdAt", "deleted", "id", "name", "ownerId", "parentFolderId", "updatedAt") SELECT "createdAt", "deleted", "id", "name", "ownerId", "parentFolderId", "updatedAt" FROM "DriveFolder";
DROP TABLE "DriveFolder";
ALTER TABLE "new_DriveFolder" RENAME TO "DriveFolder";
CREATE TABLE "new_DrivePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileId" TEXT,
    "folderId" TEXT,
    "role" TEXT NOT NULL,
    CONSTRAINT "DrivePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DrivePermission_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "DriveFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DrivePermission_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DriveFolder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DrivePermission" ("fileId", "folderId", "id", "role", "userId") SELECT "fileId", "folderId", "id", "role", "userId" FROM "DrivePermission";
DROP TABLE "DrivePermission";
ALTER TABLE "new_DrivePermission" RENAME TO "DrivePermission";
CREATE TABLE "new_DriveVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriveVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "DriveFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DriveVersion" ("createdAt", "fileId", "id", "metadata", "versionNumber") SELECT "createdAt", "fileId", "id", "metadata", "versionNumber" FROM "DriveVersion";
DROP TABLE "DriveVersion";
ALTER TABLE "new_DriveVersion" RENAME TO "DriveVersion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
