import { describe, expect, it } from "vitest";
import { localBudgetMonth } from "./budgetDate";

describe("budget month", () => {
  it("uses local calendar components", () => {
    expect(localBudgetMonth(new Date(2026, 6, 1, 0, 30))).toBe("2026-07");
  });
});
