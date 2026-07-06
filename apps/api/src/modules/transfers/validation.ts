import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { z } from "zod";

const transferAmount = z.string()
  .regex(/^(?!0+(?:\.0+)?$)(0|[1-9]\d{0,14})(\.\d{1,4})?$/, "Enter an amount greater than zero with no more than 15 whole digits and 4 decimal places")
  .transform(value => new Prisma.Decimal(value));

const transferDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid transfer date")
  .refine(value => DateTime.fromISO(value, { zone: "utc" }).isValid, "Choose a valid transfer date")
  .transform(value => DateTime.fromISO(value, { zone: "utc" }).toJSDate());

export const transferInput = z.object({
  sourceAccountId: z.string().min(1),
  destinationAccountId: z.string().min(1),
  amount: transferAmount,
  date: transferDate,
  description: z.string().trim().min(1, "Description is required").max(120, "Description must be 120 characters or fewer").default("Internal transfer"),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional()
});
