-- Supports user-scoped transaction feeds and reports filtered by active rows and ordered by date.
CREATE INDEX "Transaction_userId_deletedAt_date_idx" ON "Transaction"("userId", "deletedAt", "date");

-- Supports fetching ledger entries from already-selected transactions without scanning by transactionId alone.
CREATE INDEX "LedgerEntry_transactionId_accountId_idx" ON "LedgerEntry"("transactionId", "accountId");
