ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;

CREATE TABLE "TransactionTitle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionTitle_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction" ADD COLUMN "titleId" TEXT;

CREATE UNIQUE INDEX "TransactionTitle_userId_name_key" ON "TransactionTitle"("userId", "name");
CREATE INDEX "TransactionTitle_userId_createdAt_idx" ON "TransactionTitle"("userId", "createdAt");
CREATE INDEX "Transaction_titleId_idx" ON "Transaction"("titleId");

ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransactionTitle" ADD CONSTRAINT "TransactionTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "TransactionTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
