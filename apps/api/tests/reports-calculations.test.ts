import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { biggestExpenses, reportTrend } from "../src/modules/reports/calculations.js";
import { reportQuery } from "../src/modules/reports/query.js";

const item = (date: string, type: "INCOME" | "EXPENSE" | "TRANSFER", amount: string) => ({ date: new Date(`${date}T00:00:00Z`), type, amount: new Prisma.Decimal(amount) });

describe("report calculations", () => {
  it("builds decimal-safe daily chart data without transfers", () => {
    expect(reportTrend([item("2026-07-02", "EXPENSE", "2.2222"), item("2026-07-01", "INCOME", "10.1111"), item("2026-07-01", "TRANSFER", "999")])).toEqual([
      { label: "2026-07-01", income: "10.1111", expense: "0" },
      { label: "2026-07-02", income: "0", expense: "2.2222" }
    ]);
  });

  it("orders only the largest expenses", () => {
    expect(biggestExpenses([item("2026-07-01", "EXPENSE", "5"), item("2026-07-02", "INCOME", "100"), item("2026-07-03", "EXPENSE", "12.5")]).map(row => row.amount.toString())).toEqual(["12.5", "5"]);
  });

  it("validates an inclusive custom date range", () => {
    const query = reportQuery.parse({ period: "month", from: "2026-07-01", to: "2026-07-31" });
    expect(query.from?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(query.to?.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(() => reportQuery.parse({ from: "2026-07-31", to: "2026-07-01" })).toThrow();
    expect(() => reportQuery.parse({ from: "2026-02-30", to: "2026-03-01" })).toThrow();
  });
});
