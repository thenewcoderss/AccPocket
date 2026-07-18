CREATE TABLE "TransactionTitle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TransactionTitle_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction" ADD COLUMN "transactionTitleId" TEXT;

CREATE INDEX "TransactionTitle_userId_categoryId_isActive_idx" ON "TransactionTitle"("userId", "categoryId", "isActive");
CREATE INDEX "TransactionTitle_userId_type_isActive_idx" ON "TransactionTitle"("userId", "type", "isActive");
CREATE UNIQUE INDEX "TransactionTitle_userId_categoryId_name_ci_key" ON "TransactionTitle"("userId", "categoryId", lower("name"));
CREATE INDEX "Transaction_transactionTitleId_idx" ON "Transaction"("transactionTitleId");

ALTER TABLE "TransactionTitle" ADD CONSTRAINT "TransactionTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransactionTitle" ADD CONSTRAINT "TransactionTitle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_transactionTitleId_fkey" FOREIGN KEY ("transactionTitleId") REFERENCES "TransactionTitle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
