import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { budgetInput, budgetMonth, budgetMonthDate, budgetProgress } from "../src/modules/budgets/validation.js";

const valid = { categoryId: "category-1", month: "2026-07", limitAmount: "1000.5000" };

describe("budget validation and calculations", () => {
  it("accepts a valid budget and normalizes its month", () => {
    const result = budgetInput.parse(valid);
    expect(result.limitAmount.toString()).toBe("1000.5");
    expect(budgetMonthDate(result.month).toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("rejects invalid months and unsafe limits", () => {
    for (const month of ["2026-00", "2026-13", "2026-7", "not-a-month"]) expect(() => budgetMonth.parse(month)).toThrow();
    for (const limitAmount of ["0", "0.0000", "-1", "01", "1.23456", "1000000000000000", "1e3"]) {
      expect(() => budgetInput.parse({ ...valid, limitAmount })).toThrow();
    }
  });

  it("calculates zero, normal, full, and over-budget progress with decimals", () => {
    const limit = new Prisma.Decimal("100.10");
    expect(budgetProgress(limit, new Prisma.Decimal(0))).toEqual({ remaining: "100.1", overBy: "0", percentage: "0" });
    expect(budgetProgress(limit, new Prisma.Decimal("50.05"))).toEqual({ remaining: "50.05", overBy: "0", percentage: "50" });
    expect(budgetProgress(limit, new Prisma.Decimal("100.10"))).toEqual({ remaining: "0", overBy: "0", percentage: "100" });
    expect(budgetProgress(limit, new Prisma.Decimal("125.125"))).toEqual({ remaining: "-25.025", overBy: "25.025", percentage: "125" });
  });
});
