import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { z } from "zod";

const goalAmount = z.string()
  .regex(/^(?!0+(?:\.0+)?$)(0|[1-9]\d{0,14})(\.\d{1,4})?$/, "Enter an amount greater than zero with no more than 15 whole digits and 4 decimal places")
  .transform(value => new Prisma.Decimal(value));

const goalDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid target date")
  .refine(value => DateTime.fromISO(value, { zone: "utc" }).isValid, "Choose a valid target date")
  .transform(value => DateTime.fromISO(value, { zone: "utc" }).toJSDate());

export const goalInput = z.object({
  destinationAccountId: z.string().min(1),
  type: z.enum(["SAVINGS", "EMERGENCY_FUND"]),
  name: z.string().trim().min(1, "Goal name is required").max(80, "Goal name must be 80 characters or fewer"),
  targetAmount: goalAmount,
  targetDate: goalDate.optional()
});

export const goalUpdateInput = goalInput.pick({ name: true, targetAmount: true, targetDate: true }).partial().extend({
  targetDate: goalDate.nullable().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional()
});

export function goalProgress(target: Prisma.Decimal, saved: Prisma.Decimal) {
  if (!target.isPositive()) return { remaining: "0", overBy: saved.isPositive() ? saved.toString() : "0", percentage: saved.isPositive() ? "100" : "0" };
  return {
    remaining: target.greaterThan(saved) ? target.sub(saved).toString() : "0",
    overBy: saved.greaterThan(target) ? saved.sub(target).toString() : "0",
    percentage: saved.mul(100).div(target).toDecimalPlaces(2).toString()
  };
}
