import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { dashboardCashFlow } from "../src/modules/dashboard/calculations.js";

describe("dashboard monthly cash flow", () => {
  it("uses decimal arithmetic and excludes transfers and goal contributions", () => {
    const result = dashboardCashFlow([
      { type: "INCOME", amount: new Prisma.Decimal("1000.1234") },
      { type: "EXPENSE", amount: new Prisma.Decimal("250.1111") },
      { type: "TRANSFER", amount: new Prisma.Decimal("900") },
      { type: "TRANSFER", amount: new Prisma.Decimal("100") }
    ]);
    expect(result.income.toString()).toBe("1000.1234");
    expect(result.expenses.toString()).toBe("250.1111");
    expect(result.netCashFlow.toString()).toBe("750.0123");
  });

  it("returns zeros for a new user", () => {
    const result = dashboardCashFlow([]);
    expect(result.income.toString()).toBe("0");
    expect(result.expenses.toString()).toBe("0");
    expect(result.netCashFlow.toString()).toBe("0");
  });
});
