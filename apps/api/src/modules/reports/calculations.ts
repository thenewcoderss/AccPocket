import { Prisma } from "@prisma/client";

export function reportTrend(items: Array<{ date: Date; type: "INCOME" | "EXPENSE" | "TRANSFER"; amount: Prisma.Decimal }>) {
  const days = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>();
  for (const item of items) {
    if (item.type === "TRANSFER") continue;
    const label = item.date.toISOString().slice(0, 10);
    const current = days.get(label) ?? { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
    if (item.type === "INCOME") current.income = current.income.add(item.amount);
    if (item.type === "EXPENSE") current.expense = current.expense.add(item.amount);
    days.set(label, current);
  }
  return [...days.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([label, values]) => ({ label, income: values.income.toString(), expense: values.expense.toString() }));
}

export function biggestExpenses<T extends { type: "INCOME" | "EXPENSE" | "TRANSFER"; amount: Prisma.Decimal }>(items: T[], limit = 5) {
  return items.filter(item => item.type === "EXPENSE").sort((left, right) => right.amount.comparedTo(left.amount)).slice(0, limit);
}
