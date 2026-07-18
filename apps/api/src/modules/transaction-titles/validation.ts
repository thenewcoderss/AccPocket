import { z } from "zod";

export const transactionTitleCreateInput = z.object({
  name: z.string().trim().min(1, "Transaction title name is required").max(80, "Transaction title must be 80 characters or fewer"),
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum(["INCOME", "EXPENSE"])
});

export const transactionTitleUpdateInput = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  categoryId: z.string().min(1).optional(),
  isActive: z.boolean().optional()
}).refine(value => Object.keys(value).length > 0, "Provide at least one change");
