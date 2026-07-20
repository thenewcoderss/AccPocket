import type { AccountDto } from "@accpocket/shared";

export const activeAccounts = (accounts: AccountDto[] = []) => accounts.filter(account => !account.isArchived);
export const canAddEntry = (accounts: AccountDto[] = []) => activeAccounts(accounts).length >= 1;
export const canTransfer = (accounts: AccountDto[] = []) => activeAccounts(accounts).length >= 2;
export const contributionAccounts = (accounts: AccountDto[] = [], destinationAccountId: string) => activeAccounts(accounts).filter(account => account.id !== destinationAccountId);
