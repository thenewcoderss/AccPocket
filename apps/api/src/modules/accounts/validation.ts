import { Prisma } from "@prisma/client";
import { z } from "zod";

export const accountTypes = ["CASH", "BANK", "MOBILE_WALLET", "SAVINGS", "BUSINESS", "OTHER"] as const;

const openingBalance = z.string()
  .regex(/^(0|[1-9]\d{0,14})(\.\d{1,4})?$/, "Enter a valid non-negative amount with no more than 15 whole digits and 4 decimal places")
  .transform(value => new Prisma.Decimal(value));

export const accountInput = z.object({
  name: z.string().trim().min(1, "Account name is required").max(60, "Account name must be 60 characters or fewer"),
  type: z.enum(accountTypes),
  openingBalance: openingBalance.default("0")
});
