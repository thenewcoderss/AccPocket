import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { z } from "zod";

export const budgetMonth = z.string()
  .regex(/^\d{4}-\d{2}$/, "Choose a valid budget month")
  .refine(value => DateTime.fromFormat(value, "yyyy-MM", { zone: "utc" }).isValid, "Choose a valid budget month");

const budgetLimit = z.string()
  .regex(/^(?!0+(?:\.0+)?$)(0|[1-9]\d{0,14})(\.\d{1,4})?$/, "Enter a limit greater than zero with no more than 15 whole digits and 4 decimal places")
  .transform(value => new Prisma.Decimal(value));

export const budgetInput = z.object({
  categoryId: z.string().min(1),
  month: budgetMonth,
  limitAmount: budgetLimit
});

export function budgetMonthDate(value: string) {
  return DateTime.fromFormat(value, "yyyy-MM", { zone: "utc" }).startOf("month").toJSDate();
}

export function budgetProgress(limit: Prisma.Decimal, spent: Prisma.Decimal) {
  return {
    remaining: limit.sub(spent).toString(),
    overBy: spent.greaterThan(limit) ? spent.sub(limit).toString() : "0",
    percentage: spent.mul(100).div(limit).toDecimalPlaces(2).toString()
  };
}
