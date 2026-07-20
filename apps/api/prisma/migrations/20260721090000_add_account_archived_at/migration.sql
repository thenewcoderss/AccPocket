ALTER TABLE "Account" ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "Account"
SET "archivedAt" = "updatedAt"
WHERE "archived" = true;

DROP INDEX IF EXISTS "Account_userId_archived_idx";
DROP INDEX IF EXISTS "Account_userId_archivedAt_idx";
CREATE INDEX "Account_userId_archivedAt_idx" ON "Account"("userId", "archivedAt");

ALTER TABLE "Account" DROP COLUMN "archived";
