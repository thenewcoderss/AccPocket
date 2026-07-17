export const TRANSACTION_PAGE_SIZE = 30;

export function transactionTotalPages(total: number, pageSize = TRANSACTION_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}
