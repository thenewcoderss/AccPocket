import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { DateTime } from "luxon";
import { prisma } from "../../config/prisma.js";
import { authenticate, requireUnlock } from "../../middleware/security.js";
import { asyncRoute } from "../../utils/errors.js";
import { reportData } from "../reports/service.js";
import { budgetMonthDate, budgetProgress } from "../budgets/validation.js";
import { goalProgress } from "../goals/validation.js";
import { performanceTelemetry } from "../../middleware/performance.js";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, requireUnlock);
dashboardRouter.get("/", performanceTelemetry("dashboard"), asyncRoute(async (req, res) => {
  const period = z.literal("month").default("month").parse(req.query.period);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! }, select: { timezone: true } });
  const currentBudgetMonth = budgetMonthDate(DateTime.now().setZone(user.timezone).toFormat("yyyy-MM"));
  const [report, accounts, budgets, goals, recent] = await Promise.all([
    reportData(req.userId!, period), prisma.account.findMany({ where: { userId: req.userId!, archivedAt: null }, select: { id: true, name: true, type: true, openingBalance: true, currentBalance: true, currency: true, archivedAt: true }, orderBy: { createdAt: "asc" } }),
    prisma.budget.findMany({ where: { userId: req.userId!, month: currentBudgetMonth }, select: { id: true, categoryId: true, limitAmount: true, category: { select: { name: true } } }, take: 8, orderBy: { category: { name: "asc" } } }),
    prisma.goal.findMany({ where: { userId: req.userId!, status: "ACTIVE" }, select: { id: true, name: true, type: true, targetAmount: true, contributions: { where: { transaction: { deletedAt: null } }, select: { amount: true } } } }),
    prisma.transaction.findMany({ where: { userId: req.userId!, deletedAt: null }, select: { id: true, type: true, date: true, description: true, transactionTitle: { select: { id: true, name: true, isActive: true } }, category: true, entries: { select: { amount: true, account: { select: { name: true } } } } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 6 })
  ]);
  res.json({ success: true, data: { totalBalance: report.totalBalance, income: report.income, expenses: report.expenses, netCashFlow: report.netCashFlow, accounts: accounts.map(a => ({ id: a.id, name: a.name, type: a.type, openingBalance: a.openingBalance.toString(), currentBalance: a.currentBalance.toString(), currency: a.currency, archivedAt: null, isArchived: false })), recentTransactions: recent.map(t => ({ id: t.id, type: t.type, amount: (t.entries.find(e => e.amount.isPositive())?.amount ?? t.entries[0]?.amount.abs() ?? 0).toString(), date: t.date.toISOString(), title: t.transactionTitle?.name ?? (t.type === "TRANSFER" ? "Internal transfer" : t.description || "Untitled transaction"), transactionTitle: t.transactionTitle, description: t.description, category: t.category, accountName: t.type === "TRANSFER" ? t.entries.find(e => e.amount.isNegative())?.account.name : t.entries[0]?.account.name, destinationAccountName: t.type === "TRANSFER" ? t.entries.find(e => e.amount.isPositive())?.account.name : undefined })), spendingByCategory: report.categories, trend: [], budgets: budgets.map(b => { const spent = new Prisma.Decimal(report.categories.find(c => c.id === b.categoryId)?.amount ?? 0); return { id: b.id, name: b.category.name, limit: b.limitAmount.toString(), spent: spent.toString(), ...budgetProgress(b.limitAmount, spent) }; }), goals: goals.map(g => { const saved = g.contributions.reduce((s, c) => s.add(c.amount), new Prisma.Decimal(0)); return { id: g.id, name: g.name, type: g.type, target: g.targetAmount.toString(), saved: saved.toString(), percentage: goalProgress(g.targetAmount, saved).percentage }; }) } });
}));
