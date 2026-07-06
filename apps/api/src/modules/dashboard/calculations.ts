import { Prisma } from "@prisma/client";

export function dashboardCashFlow(items: Array<{ type: "INCOME" | "EXPENSE" | "TRANSFER"; amount: Prisma.Decimal }>) {
  let income = new Prisma.Decimal(0);
  let expenses = new Prisma.Decimal(0);
  for (const item of items) {
    if (item.type === "INCOME") income = income.add(item.amount);
    if (item.type === "EXPENSE") expenses = expenses.add(item.amount);
  }
  return { income, expenses, netCashFlow: income.sub(expenses) };
}
