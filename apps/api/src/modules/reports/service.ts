import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "../../config/prisma.js";
import { dashboardCashFlow } from "../dashboard/calculations.js";
import { biggestExpenses, reportTrend } from "./calculations.js";

export function rangeFor(period: "day" | "week" | "month", timezone: string, at: DateTime<boolean> = DateTime.now()) {
  const local = at.setZone(timezone);
  const start = local.startOf(period);
  return { start: start.toUTC().toJSDate(), end: start.plus({ [`${period}s`]: 1 }).toUTC().toJSDate() };
}

export async function reportData(userId: string, period: "day" | "week" | "month", from?: Date, to?: Date) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, defaultCurrency: true, timezone: true } });
  const range = from && to ? { start: from, end: to } : rangeFor(period, user.timezone);
  const rows = await prisma.transaction.findMany({ where: { userId, deletedAt: null, date: { gte: range.start, lt: range.end } }, select: { id: true, type: true, categoryId: true, date: true, description: true, category: { select: { name: true, color: true } }, entries: { select: { amount: true, account: { select: { name: true } } } } }, orderBy: { date: "desc" } });
  const transactionAmounts = rows.map(row => ({ type: row.type, amount: row.entries.find(e => e.amount.isPositive())?.amount.abs() ?? row.entries[0]?.amount.abs() ?? new Prisma.Decimal(0) }));
  const { income, expenses, netCashFlow } = dashboardCashFlow(transactionAmounts);
  const categoryMap = new Map<string, { id?: string; name: string; color: string; amount: Prisma.Decimal }>();
  const transactions = rows.map(row => {
    const amount = row.entries.find(e => e.amount.isPositive())?.amount.abs() ?? row.entries[0]?.amount.abs() ?? new Prisma.Decimal(0);
    if (row.type === "EXPENSE") {
      const key = row.categoryId ?? "uncategorized";
      const old = categoryMap.get(key);
      categoryMap.set(key, { id: row.categoryId ?? undefined, name: row.category?.name ?? "Uncategorized", color: row.category?.color ?? "#64748b", amount: (old?.amount ?? new Prisma.Decimal(0)).add(amount) });
    }
    const sourceAccount = row.entries.find(entry => entry.amount.isNegative())?.account.name;
    const destinationAccount = row.entries.find(entry => entry.amount.isPositive())?.account.name;
    const account = row.type === "TRANSFER" ? `${sourceAccount ?? "Wallet"} → ${destinationAccount ?? "Wallet"}` : row.entries[0]?.account.name ?? "—";
    return { id: row.id, date: row.date.toISOString(), type: row.type, description: row.description, category: row.category?.name ?? "—", account, amount: amount.toString() };
  });
  const accounts = await prisma.account.findMany({ where: { userId, archived: false }, select: { name: true, currentBalance: true, currency: true }, orderBy: { name: "asc" } });
  const detailedAmounts = rows.map((row, index) => ({ ...transactions[index], type: row.type, dateValue: row.date, amountValue: transactionAmounts[index].amount }));
  return { owner: user.name, currency: user.defaultCurrency, period, from: range.start.toISOString(), to: range.end.toISOString(), income: income.toString(), expenses: expenses.toString(), netCashFlow: netCashFlow.toString(), totalBalance: accounts.reduce((s, a) => s.add(a.currentBalance), new Prisma.Decimal(0)).toString(), accounts: accounts.map(a => ({ name: a.name, balance: a.currentBalance.toString(), currency: a.currency })), categories: [...categoryMap.values()].map(c => ({ ...c, amount: c.amount.toString() })), transactions, trend: reportTrend(rows.map((row, index) => ({ date: row.date, type: row.type, amount: transactionAmounts[index].amount }))), biggestExpenses: biggestExpenses(detailedAmounts.map(row => ({ ...row, amount: row.amountValue }))).map(row => ({ id: row.id, date: row.date, description: row.description, account: row.account, amount: row.amount.toString() })) };
}
