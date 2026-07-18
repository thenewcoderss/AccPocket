export type Money = string;
export type Period = "day" | "week" | "month";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type CategoryType = "INCOME" | "EXPENSE";
export type GoalType = "SAVINGS" | "EMERGENCY_FUND";
export type AccountType = "CASH" | "BANK" | "MOBILE_WALLET" | "SAVINGS" | "BUSINESS" | "OTHER";

export interface ApiSuccess<T> { success: true; data: T }
export interface ApiFailure {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string[]>; requestId?: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface SessionUser {
  id: string; name: string; email: string; defaultCurrency: string; timezone: string;
  passcodeEnabled: boolean;
}

export interface AccountDto {
  id: string; name: string; type: AccountType; openingBalance: Money; currentBalance: Money;
  currency: string; archived: boolean;
}

export interface TransactionDto {
  id: string; type: TransactionType; amount: Money; date: string; description: string;
  category?: { id: string; name: string; color: string } | null;
  transactionTitle?: { id: string; name: string; isActive: boolean } | null;
  accountName?: string; destinationAccountName?: string;
}

export interface DashboardDto {
  totalBalance: Money; income: Money; expenses: Money; netCashFlow: Money;
  accounts: AccountDto[]; recentTransactions: TransactionDto[];
  spendingByCategory: Array<{ id?: string; name: string; amount: Money; color: string }>;
  trend: Array<{ label: string; income: Money; expense: Money }>;
  budgets: Array<{ id: string; name: string; limit: Money; spent: Money; remaining: Money; overBy: Money; percentage: string }>;
  goals: Array<{ id: string; name: string; type: GoalType; target: Money; saved: Money; percentage: string }>;
}

export const DEFAULT_CATEGORIES = {
  EXPENSE: ["Food", "Housing", "Transport", "Utilities", "Health", "Education", "Shopping", "Business", "Other"],
  INCOME: ["Salary", "Business", "Remittance", "Gift", "Other"]
} as const;
