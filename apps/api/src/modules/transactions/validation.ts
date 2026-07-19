import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { z } from "zod";

const transactionAmount = z.string()
  .regex(/^(?!0+(?:\.0+)?$)(0|[1-9]\d{0,14})(\.\d{1,4})?$/, "Enter an amount greater than zero with no more than 15 whole digits and 4 decimal places")
  .transform(value => new Prisma.Decimal(value));

const transactionDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid transaction date")
  .refine(value => DateTime.fromISO(value, { zone: "utc" }).isValid, "Choose a valid transaction date")
  .transform(value => DateTime.fromISO(value, { zone: "utc" }).toJSDate());

export const transactionInput = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  titleId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: transactionAmount,
  date: transactionDate,
  description: z.string().trim().max(120, "Description must be 120 characters or fewer").default(""),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional()
});

export function signedTransactionAmount(type: "INCOME" | "EXPENSE", amount: Prisma.Decimal) {
  return type === "INCOME" ? amount : amount.negated();
}

export function fitsMoneyColumn(value: Prisma.Decimal) {
  return value.abs().lessThan(new Prisma.Decimal("1000000000000000")) && value.decimalPlaces() <= 4;
}
