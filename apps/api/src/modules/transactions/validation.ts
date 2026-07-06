import { Prisma } from "@prisma/client";
import { z } from "zod";

const transactionAmount = z.string()
  .regex(/^(?!0+(?:\.0+)?$)(0|[1-9]\d{0,14})(\.\d{1,4})?$/, "Enter an amount greater than zero with no more than 15 whole digits and 4 decimal places")
  .transform(value => new Prisma.Decimal(value));

export const transactionInput = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: transactionAmount,
  date: z.coerce.date(),
  description: z.string().trim().min(1, "Description is required").max(120, "Description must be 120 characters or fewer"),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional()
});

export function signedTransactionAmount(type: "INCOME" | "EXPENSE", amount: Prisma.Decimal) {
  return type === "INCOME" ? amount : amount.negated();
}
