import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { DateTime } from "luxon";
import { prisma } from "../../config/prisma.js";
import { authenticate, requireUnlock } from "../../middleware/security.js";
import { AppError, asyncRoute } from "../../utils/errors.js";
import { accountInput } from "../accounts/validation.js";
import { fitsMoneyColumn, signedTransactionAmount, transactionInput } from "../transactions/validation.js";
import { transferInput } from "../transfers/validation.js";
import { budgetInput, budgetMonth, budgetMonthDate, budgetProgress } from "../budgets/validation.js";
import { goalInput, goalProgress, goalUpdateInput } from "../goals/validation.js";
import { transactionTitleCreateInput, transactionTitleRemovalAction, transactionTitleUpdateInput } from "../transaction-titles/validation.js";

export const financeRouter = Router();
financeRouter.use(authenticate, requireUnlock);
const money = z.string().regex(/^\d+(\.\d{1,4})?$/).transform(v => new Prisma.Decimal(v));
const id = z.string().min(1);
const serializeAccount = (a: { id: string; name: string; type: string; openingBalance: Prisma.Decimal; currentBalance: Prisma.Decimal; currency: string; archived: boolean }) => ({ ...a, openingBalance: a.openingBalance.toString(), currentBalance: a.currentBalance.toString() });

async function ownedAccount(userId: string, accountId: string, tx: Prisma.TransactionClient = prisma) {
  const account = await tx.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new AppError(404, "ACCOUNT_NOT_FOUND", "Wallet was not found");
  if (account.archived) throw new AppError(409, "ACCOUNT_ARCHIVED", "Archived wallets cannot be changed");
  return account;
}

async function lockOwnedAccount(userId: string, accountId: string, tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Account" WHERE "id" = ${accountId} AND "userId" = ${userId} FOR UPDATE`);
  if (!rows.length) throw new AppError(404, "ACCOUNT_NOT_FOUND", "Wallet was not found");
  return ownedAccount(userId, accountId, tx);
}

financeRouter.get("/accounts", asyncRoute(async (req, res) => {
  const rows = await prisma.account.findMany({ where: { userId: req.userId! }, select: { id: true, name: true, type: true, openingBalance: true, currentBalance: true, currency: true, archived: true }, orderBy: { createdAt: "asc" } });
  res.json({ success: true, data: rows.map(serializeAccount) });
}));
financeRouter.post("/accounts", asyncRoute(async (req, res) => {
  const input = accountInput.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const account = await prisma.account.create({ data: { userId: user.id, currency: user.defaultCurrency, name: input.name, type: input.type, openingBalance: input.openingBalance, currentBalance: input.openingBalance } });
  res.status(201).json({ success: true, data: serializeAccount(account) });
}));
financeRouter.patch("/accounts/:id", asyncRoute(async (req, res) => {
  const accountId = String(req.params.id);
  await ownedAccount(req.userId!, accountId);
  const input = accountInput.pick({ name: true, type: true }).partial().parse(req.body);
  const account = await prisma.account.update({ where: { id: accountId }, data: input });
  res.json({ success: true, data: serializeAccount(account) });
}));
financeRouter.delete("/accounts/:id", asyncRoute(async (req, res) => {
  const accountId = String(req.params.id);
  await ownedAccount(req.userId!, accountId);
  if (await prisma.ledgerEntry.count({ where: { accountId } })) throw new AppError(409, "ACCOUNT_HAS_HISTORY", "This wallet cannot be deleted because it has transaction history");
  await prisma.account.delete({ where: { id: accountId } });
  res.json({ success: true, data: null });
}));

financeRouter.get("/categories", asyncRoute(async (req, res) => {
  res.json({ success: true, data: await prisma.category.findMany({ where: { userId: req.userId! }, select: { id: true, name: true, type: true, color: true, icon: true, system: true, createdAt: true }, orderBy: [{ type: "asc" }, { name: "asc" }] }) });
}));
financeRouter.post("/categories", asyncRoute(async (req, res) => {
  const input = z.object({ name: z.string().trim().min(1).max(40), type: z.enum(["INCOME", "EXPENSE"]), color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#64748b"), icon: z.string().max(30).default("tag") }).parse(req.body);
  const row = await prisma.category.create({ data: { ...input, userId: req.userId! } });
  res.status(201).json({ success: true, data: row });
}));
financeRouter.patch("/categories/:id", asyncRoute(async (req, res) => {
  const existing = await prisma.category.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!existing) throw new AppError(404, "CATEGORY_NOT_FOUND", "Category was not found");
  const input = z.object({ name: z.string().trim().min(1).max(40).optional(), color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(), icon: z.string().max(30).optional() }).parse(req.body);
  res.json({ success: true, data: await prisma.category.update({ where: { id: existing.id }, data: input }) });
}));

async function titleCategory(userId: string, categoryId: string, type?: "INCOME" | "EXPENSE") {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId, type } });
  if (!category) throw new AppError(422, "INVALID_TITLE_CATEGORY", "Choose a valid category with the same transaction type");
  return category;
}
async function rejectDuplicateTitle(userId: string, categoryId: string, name: string, exceptId?: string) {
  const duplicate = await prisma.transactionTitle.findFirst({ where: { userId, categoryId, id: exceptId ? { not: exceptId } : undefined, name: { equals: name, mode: "insensitive" } } });
  if (duplicate) throw new AppError(409, "TRANSACTION_TITLE_EXISTS", "A transaction title with this name already exists in the category");
}
financeRouter.get("/transaction-titles", asyncRoute(async (req, res) => {
  const query = z.object({ categoryId: z.string().optional(), type: z.enum(["INCOME", "EXPENSE"]).optional(), includeArchived: z.coerce.boolean().default(false) }).parse(req.query);
  const rows = await prisma.transactionTitle.findMany({ where: { userId: req.userId!, categoryId: query.categoryId, type: query.type, isActive: query.includeArchived ? undefined : true }, include: { category: true, _count: { select: { transactions: true } } }, orderBy: [{ type: "asc" }, { category: { name: "asc" } }, { name: "asc" }] });
  res.json({ success: true, data: rows });
}));
financeRouter.post("/transaction-titles", asyncRoute(async (req, res) => {
  const input = transactionTitleCreateInput.parse(req.body);
  await titleCategory(req.userId!, input.categoryId, input.type);
  await rejectDuplicateTitle(req.userId!, input.categoryId, input.name);
  res.status(201).json({ success: true, data: await prisma.transactionTitle.create({ data: { ...input, userId: req.userId! }, include: { category: true, _count: { select: { transactions: true } } } }) });
}));
financeRouter.patch("/transaction-titles/:id", asyncRoute(async (req, res) => {
  const existing = await prisma.transactionTitle.findFirst({ where: { id: String(req.params.id), userId: req.userId! }, include: { _count: { select: { transactions: true } } } });
  if (!existing) throw new AppError(404, "TRANSACTION_TITLE_NOT_FOUND", "Transaction title was not found");
  const input = transactionTitleUpdateInput.parse(req.body);
  const category = input.categoryId ? await titleCategory(req.userId!, input.categoryId) : null;
  if (category && category.type !== existing.type) {
    if (existing._count.transactions) throw new AppError(409, "TRANSACTION_TITLE_IN_USE", "This transaction title cannot be moved because it is used by existing transactions.");
    throw new AppError(422, "INVALID_TITLE_CATEGORY", "Transaction titles cannot be moved between Income and Expense");
  }
  await rejectDuplicateTitle(req.userId!, input.categoryId ?? existing.categoryId, input.name ?? existing.name, existing.id);
  res.json({ success: true, data: await prisma.transactionTitle.update({ where: { id: existing.id }, data: input, include: { category: true, _count: { select: { transactions: true } } } }) });
}));
financeRouter.delete("/transaction-titles/:id", asyncRoute(async (req, res) => {
  const existing = await prisma.transactionTitle.findFirst({ where: { id: String(req.params.id), userId: req.userId! }, include: { _count: { select: { transactions: true } } } });
  if (!existing) throw new AppError(404, "TRANSACTION_TITLE_NOT_FOUND", "Transaction title was not found");
  if (transactionTitleRemovalAction(existing._count.transactions) === "ARCHIVE") {
    const row = await prisma.transactionTitle.update({ where: { id: existing.id }, data: { isActive: false } });
    return res.json({ success: true, data: { ...row, message: "This transaction title is used by existing transactions and was archived instead." } });
  }
  await prisma.transactionTitle.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { deleted: true } });
}));

async function assertCategory(userId: string, categoryId: string | undefined, type: "INCOME" | "EXPENSE", tx: Prisma.TransactionClient = prisma) {
  if (!categoryId) return null;
  const category = await tx.category.findFirst({ where: { id: categoryId, userId, type } });
  if (!category) throw new AppError(422, "INVALID_CATEGORY", `Choose a valid ${type.toLowerCase()} category`);
  return category;
}
async function assertTransactionTitle(userId: string, transactionTitleId: string | undefined, categoryId: string | undefined, type: "INCOME" | "EXPENSE", tx: Prisma.TransactionClient = prisma) {
  if (!transactionTitleId) return null;
  if (!categoryId) throw new AppError(422, "TITLE_REQUIRES_CATEGORY", "Choose a category before choosing a transaction title");
  const title = await tx.transactionTitle.findFirst({ where: { id: transactionTitleId, userId, categoryId, type, isActive: true } });
  if (!title) throw new AppError(422, "INVALID_TRANSACTION_TITLE", "Choose an active transaction title from the selected category");
  return title;
}
financeRouter.get("/transactions", asyncRoute(async (req, res) => {
  const query = z.object({ type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(), accountId: z.string().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(30) }).parse(req.query);
  const where: Prisma.TransactionWhereInput = { userId: req.userId!, deletedAt: null, type: query.type, entries: query.accountId ? { some: { accountId: query.accountId } } : undefined };
  const [rows, total] = await prisma.$transaction([prisma.transaction.findMany({ where, select: { id: true, type: true, date: true, description: true, category: true, transactionTitle: true, entries: { select: { amount: true, account: { select: { name: true } } } } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], skip: (query.page - 1) * query.limit, take: query.limit }), prisma.transaction.count({ where })]);
  res.json({ success: true, data: { items: rows.map(row => ({ id: row.id, type: row.type, amount: row.entries.find(e => e.amount.isPositive())?.amount.abs().toString() ?? row.entries[0]?.amount.abs().toString(), date: row.date.toISOString(), description: row.description, category: row.category, transactionTitle: row.transactionTitle, accountName: row.entries.find(e => e.amount.isNegative())?.account.name ?? row.entries[0]?.account.name, destinationAccountName: row.type === "TRANSFER" ? row.entries.find(e => e.amount.isPositive())?.account.name : undefined })), page: query.page, total } });
}));
financeRouter.post("/transactions", asyncRoute(async (req, res) => {
  const input = transactionInput.parse(req.body);
  const created = await prisma.$transaction(async tx => {
    const account = await lockOwnedAccount(req.userId!, input.accountId, tx);
    await assertCategory(req.userId!, input.categoryId, input.type, tx);
    await assertTransactionTitle(req.userId!, input.transactionTitleId, input.categoryId, input.type, tx);
    const signed = signedTransactionAmount(input.type, input.amount);
    const settings = await tx.userSettings.findUnique({ where: { userId: req.userId! } });
    const next = account.currentBalance.add(signed);
    if (!settings?.allowNegativeBalances && next.isNegative()) throw new AppError(409, "INSUFFICIENT_BALANCE", "This expense would make the wallet balance negative");
    if (!fitsMoneyColumn(next)) throw new AppError(422, "BALANCE_LIMIT", "This transaction would exceed the supported wallet balance range");
    const transaction = await tx.transaction.create({ data: { userId: req.userId!, categoryId: input.categoryId, transactionTitleId: input.transactionTitleId, type: input.type, date: input.date, description: input.description, notes: input.notes, entries: { create: { accountId: account.id, amount: signed, resultingBalance: next } } } });
    await tx.account.update({ where: { id: account.id }, data: { currentBalance: next } });
    return transaction;
  });
  res.status(201).json({ success: true, data: created });
}));
financeRouter.delete("/transactions/:id", asyncRoute(async (req, res) => {
  await prisma.$transaction(async tx => {
    const transactionId = String(req.params.id);
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Transaction" WHERE "id" = ${transactionId} AND "userId" = ${req.userId!} AND "deletedAt" IS NULL FOR UPDATE`);
    if (!locked.length) throw new AppError(404, "TRANSACTION_NOT_FOUND", "Transaction was not found");
    const row = await tx.transaction.findFirst({ where: { id: transactionId, userId: req.userId!, deletedAt: null }, include: { entries: true } });
    if (!row) throw new AppError(404, "TRANSACTION_NOT_FOUND", "Transaction was not found");
    const accountIds = [...new Set(row.entries.map(entry => entry.accountId))].sort();
    const ownedAccounts = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Account" WHERE "id" IN (${Prisma.join(accountIds)}) AND "userId" = ${req.userId!} ORDER BY "id" FOR UPDATE`);
    if (ownedAccounts.length !== accountIds.length) throw new AppError(404, "ACCOUNT_NOT_FOUND", "Wallet was not found");
    for (const entry of row.entries) await tx.account.update({ where: { id: entry.accountId }, data: { currentBalance: { decrement: entry.amount } } });
    await tx.transaction.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
  });
  res.json({ success: true, data: null });
}));

const transferSchema = transferInput.extend({ goalId: id.optional() });
async function createTransfer(userId: string, input: z.infer<typeof transferSchema>) {
  return prisma.$transaction(async tx => {
    if (input.sourceAccountId === input.destinationAccountId) throw new AppError(422, "SAME_ACCOUNT", "Choose two different wallets");
    const accountIds = [input.sourceAccountId, input.destinationAccountId].sort();
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Account" WHERE "id" IN (${Prisma.join(accountIds)}) AND "userId" = ${userId} ORDER BY "id" FOR UPDATE`);
    if (locked.length !== 2) throw new AppError(404, "ACCOUNT_NOT_FOUND", "Wallet was not found");
    const accounts = await tx.account.findMany({ where: { id: { in: accountIds }, userId } });
    const source = accounts.find(account => account.id === input.sourceAccountId);
    const destination = accounts.find(account => account.id === input.destinationAccountId);
    if (!source || !destination) throw new AppError(404, "ACCOUNT_NOT_FOUND", "Wallet was not found");
    if (source.archived || destination.archived) throw new AppError(409, "ACCOUNT_ARCHIVED", "Archived wallets cannot be changed");
    if (source.currency !== destination.currency) throw new AppError(422, "CURRENCY_MISMATCH", "Wallets must use the same currency");
    const settings = await tx.userSettings.findUnique({ where: { userId } });
    const sourceNext = source.currentBalance.sub(input.amount);
    if (!settings?.allowNegativeBalances && sourceNext.isNegative()) throw new AppError(409, "INSUFFICIENT_BALANCE", "Source wallet has insufficient balance");
    const destinationNext = destination.currentBalance.add(input.amount);
    if (!fitsMoneyColumn(sourceNext) || !fitsMoneyColumn(destinationNext)) throw new AppError(422, "BALANCE_LIMIT", "This transfer would exceed the supported wallet balance range");
    if (input.goalId) {
      const goal = await tx.goal.findFirst({ where: { id: input.goalId, userId, destinationAccountId: destination.id, status: "ACTIVE" } });
      if (!goal) throw new AppError(422, "INVALID_GOAL", "Goal and destination wallet do not match");
    }
    const transaction = await tx.transaction.create({ data: { userId, type: "TRANSFER", date: input.date, description: input.description, notes: input.notes, source: input.goalId ? "GOAL_CONTRIBUTION" : "MANUAL", entries: { create: [{ accountId: source.id, amount: input.amount.negated(), resultingBalance: sourceNext }, { accountId: destination.id, amount: input.amount, resultingBalance: destinationNext }] } } });
    await tx.account.update({ where: { id: source.id }, data: { currentBalance: sourceNext } });
    await tx.account.update({ where: { id: destination.id }, data: { currentBalance: destinationNext } });
    if (input.goalId) await tx.goalContribution.create({ data: { goalId: input.goalId, transactionId: transaction.id, amount: input.amount, date: input.date } });
    return transaction;
  });
}
financeRouter.post("/transfers", asyncRoute(async (req, res) => res.status(201).json({ success: true, data: await createTransfer(req.userId!, transferSchema.omit({ goalId: true }).parse(req.body)) })));

financeRouter.get("/budgets", asyncRoute(async (req, res) => {
  const monthText = budgetMonth.default(DateTime.now().toFormat("yyyy-MM")).parse(req.query.month);
  const start = DateTime.fromJSDate(budgetMonthDate(monthText), { zone: "utc" });
  const rows = await prisma.budget.findMany({ where: { userId: req.userId!, month: start.toJSDate() }, include: { category: true }, orderBy: { category: { name: "asc" } } });
  const spent = await prisma.ledgerEntry.groupBy({ by: ["transactionId"], where: { transaction: { userId: req.userId!, type: "EXPENSE", deletedAt: null, date: { gte: start.toJSDate(), lt: start.plus({ months: 1 }).toJSDate() } } }, _sum: { amount: true } });
  const txs = await prisma.transaction.findMany({ where: { id: { in: spent.map(s => s.transactionId) } }, select: { id: true, categoryId: true } });
  const txCategories = new Map(txs.map(tx => [tx.id, tx.categoryId]));
  const sums = new Map<string, Prisma.Decimal>();
  for (const item of spent) { const category = txCategories.get(item.transactionId); if (category) sums.set(category, (sums.get(category) ?? new Prisma.Decimal(0)).add(item._sum.amount?.abs() ?? 0)); }
  res.json({ success: true, data: rows.map(b => { const amount = sums.get(b.categoryId) ?? new Prisma.Decimal(0); return { id: b.id, categoryId: b.categoryId, name: b.category.name, color: b.category.color, month: monthText, limit: b.limitAmount.toString(), spent: amount.toString(), ...budgetProgress(b.limitAmount, amount) }; }) });
}));
financeRouter.post("/budgets", asyncRoute(async (req, res) => {
  const input = budgetInput.parse(req.body);
  await assertCategory(req.userId!, input.categoryId, "EXPENSE");
  const month = budgetMonthDate(input.month);
  const existing = await prisma.budget.findUnique({ where: { userId_categoryId_month: { userId: req.userId!, categoryId: input.categoryId, month } } });
  if (existing) throw new AppError(409, "BUDGET_EXISTS", "A budget already exists for this category and month");
  const row = await prisma.budget.create({ data: { userId: req.userId!, categoryId: input.categoryId, month, limitAmount: input.limitAmount } });
  res.status(201).json({ success: true, data: { ...row, limitAmount: row.limitAmount.toString() } });
}));
financeRouter.patch("/budgets/:id", asyncRoute(async (req, res) => {
  const row = await prisma.budget.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!row) throw new AppError(404, "BUDGET_NOT_FOUND", "Budget was not found");
  const { limitAmount } = budgetInput.pick({ limitAmount: true }).parse(req.body);
  const updated = await prisma.budget.update({ where: { id: row.id }, data: { limitAmount } });
  res.json({ success: true, data: { ...updated, limitAmount: updated.limitAmount.toString() } });
}));
financeRouter.delete("/budgets/:id", asyncRoute(async (req, res) => {
  const result = await prisma.budget.deleteMany({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!result.count) throw new AppError(404, "BUDGET_NOT_FOUND", "Budget was not found");
  res.json({ success: true, data: null });
}));

financeRouter.get("/goals", asyncRoute(async (req, res) => {
  const rows = await prisma.goal.findMany({ where: { userId: req.userId! }, include: { destinationAccount: true, contributions: { where: { transaction: { deletedAt: null } } } }, orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: rows.map(g => { const saved = g.contributions.reduce((sum, c) => sum.add(c.amount), new Prisma.Decimal(0)); return { id: g.id, name: g.name, type: g.type, targetAmount: g.targetAmount.toString(), targetDate: g.targetDate?.toISOString(), status: g.status, destinationAccountId: g.destinationAccountId, destinationAccountName: g.destinationAccount.name, saved: saved.toString(), ...goalProgress(g.targetAmount, saved) }; }) });
}));
financeRouter.post("/goals", asyncRoute(async (req, res) => {
  const input = goalInput.parse(req.body);
  await ownedAccount(req.userId!, input.destinationAccountId);
  const row = await prisma.goal.create({ data: { ...input, userId: req.userId! } });
  res.status(201).json({ success: true, data: { ...row, targetAmount: row.targetAmount.toString() } });
}));
financeRouter.patch("/goals/:id", asyncRoute(async (req, res) => {
  const goal = await prisma.goal.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!goal) throw new AppError(404, "GOAL_NOT_FOUND", "Goal was not found");
  const input = goalUpdateInput.parse(req.body);
  const row = await prisma.goal.update({ where: { id: goal.id }, data: input });
  res.json({ success: true, data: { ...row, targetAmount: row.targetAmount.toString() } });
}));
financeRouter.post("/goals/:id/contributions", asyncRoute(async (req, res) => {
  const goal = await prisma.goal.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!goal) throw new AppError(404, "GOAL_NOT_FOUND", "Goal was not found");
  const body = transferInput.omit({ destinationAccountId: true }).parse(req.body);
  res.status(201).json({ success: true, data: await createTransfer(req.userId!, { ...body, destinationAccountId: goal.destinationAccountId, goalId: goal.id }) });
}));
