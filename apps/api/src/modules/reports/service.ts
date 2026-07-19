import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { logPerformance } from "../../middleware/performance.js";
import { dashboardCashFlow } from "../dashboard/calculations.js";
import { biggestExpenses, reportTrend } from "./calculations.js";
import { reportDetailLimit } from "./limits.js";

export function rangeFor(period: "day" | "week" | "month", timezone: string, at: DateTime<boolean> = DateTime.now()) {
  const local = at.setZone(timezone);
  const start = local.startOf(period);
  return { start: start.toUTC().toJSDate(), end: start.plus({ [`${period}s`]: 1 }).toUTC().toJSDate() };
}

export async function reportTransactionCount(userId: string, period: "day" | "week" | "month", from?: Date, to?: Date) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
  const range = from && to ? { start: from, end: to } : rangeFor(period, user.timezone);
  return prisma.transaction.count({ where: { userId, deletedAt: null, date: { gte: range.start, lt: range.end } } });
}

export async function reportData(userId: string, period: "day" | "week" | "month", from?: Date, to?: Date, detailRowLimit = env.REPORT_DETAIL_ROW_LIMIT) {
  const started = performance.now();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, defaultCurrency: true, timezone: true } });
  const range = from && to ? { start: from, end: to } : rangeFor(period, user.timezone);
  const rows = await prisma.transaction.findMany({ where: { userId, deletedAt: null, date: { gte: range.start, lt: range.end } }, select: { id: true, type: true, categoryId: true, date: true, description: true, transactionTitle: { select: { name: true } }, category: { select: { name: true, color: true } }, entries: { select: { amount: true, account: { select: { name: true } } } } }, orderBy: { date: "desc" } });
  const transactionAmounts = rows.map(row => ({ type: row.type, amount: row.entries.find(e => e.amount.isPositive())?.amount.abs() ?? row.entries[0]?.amount.abs() ?? new Prisma.Decimal(0) }));
  const { income, expenses, netCashFlow } = dashboardCashFlow(transactionAmounts);
  const categoryMap = new Map<string, { id?: string; name: string; color: string; amount: Prisma.Decimal }>();
  rows.forEach((row, index) => {
    if (row.type !== "EXPENSE") return;
    const key = row.categoryId ?? "uncategorized";
    const old = categoryMap.get(key);
    categoryMap.set(key, { id: row.categoryId ?? undefined, name: row.category?.name ?? "Uncategorized", color: row.category?.color ?? "#64748b", amount: (old?.amount ?? new Prisma.Decimal(0)).add(transactionAmounts[index].amount) });
  });
  const detail = reportDetailLimit(rows.length, detailRowLimit);
  const transactions = rows.slice(0, detailRowLimit).map(row => {
    const amount = row.entries.find(e => e.amount.isPositive())?.amount.abs() ?? row.entries[0]?.amount.abs() ?? new Prisma.Decimal(0);
    const sourceAccount = row.entries.find(entry => entry.amount.isNegative())?.account.name;
    const destinationAccount = row.entries.find(entry => entry.amount.isPositive())?.account.name;
    const account = row.type === "TRANSFER" ? `${sourceAccount ?? "Wallet"} → ${destinationAccount ?? "Wallet"}` : row.entries[0]?.account.name ?? "—";
    return { id: row.id, date: row.date.toISOString(), type: row.type, title: row.transactionTitle?.name ?? (row.type === "TRANSFER" ? "Internal transfer" : row.description || "Untitled transaction"), description: row.description, category: row.category?.name ?? "—", account, amount: amount.toString() };
  });
  const accounts = await prisma.account.findMany({ where: { userId, archived: false }, select: { name: true, currentBalance: true, currency: true }, orderBy: { name: "asc" } });
  const detailedAmounts = rows.map((row, index) => { const source = row.entries.find(entry => entry.amount.isNegative())?.account.name; const destination = row.entries.find(entry => entry.amount.isPositive())?.account.name; return { id: row.id, date: row.date.toISOString(), type: row.type, title: row.transactionTitle?.name ?? (row.type === "TRANSFER" ? "Internal transfer" : row.description || "Untitled transaction"), description: row.description, account: row.type === "TRANSFER" ? `${source ?? "Wallet"} → ${destination ?? "Wallet"}` : row.entries[0]?.account.name ?? "—", amount: transactionAmounts[index].amount }; });
  const result = { owner: user.name, currency: user.defaultCurrency, period, from: range.start.toISOString(), to: range.end.toISOString(), income: income.toString(), expenses: expenses.toString(), netCashFlow: netCashFlow.toString(), totalBalance: accounts.reduce((s, a) => s.add(a.currentBalance), new Prisma.Decimal(0)).toString(), accounts: accounts.map(a => ({ name: a.name, balance: a.currentBalance.toString(), currency: a.currency })), categories: [...categoryMap.values()].map(c => ({ ...c, amount: c.amount.toString() })), transactions, detail, trend: reportTrend(rows.map((row, index) => ({ date: row.date, type: row.type, amount: transactionAmounts[index].amount }))), biggestExpenses: biggestExpenses(detailedAmounts).map(row => ({ id: row.id, date: row.date, title: row.title, description: row.description, account: row.account, amount: row.amount.toString() })) };
  logPerformance({ event: "report_detail", route: "reports.detail", durationMs: performance.now() - started, rowCount: detail.total, limitReached: detail.limited });
  return result;
}
