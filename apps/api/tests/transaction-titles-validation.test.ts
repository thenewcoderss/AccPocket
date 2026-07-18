import { describe, expect, it } from "vitest";
import { transactionTitleCreateInput, transactionTitleUpdateInput } from "../src/modules/transaction-titles/validation.js";

describe("transaction title validation", () => {
  it("creates trimmed income and expense titles assigned to categories", () => {
    expect(transactionTitleCreateInput.parse({ name: " Monthly salary ", categoryId: "salary", type: "INCOME" })).toEqual({ name: "Monthly salary", categoryId: "salary", type: "INCOME" });
    expect(transactionTitleCreateInput.parse({ name: " Gas bill ", categoryId: "utility", type: "EXPENSE" }).name).toBe("Gas bill");
  });
  it("rejects missing categories, blank names, and oversized names", () => {
    for (const value of [{ name: "", categoryId: "x", type: "EXPENSE" }, { name: "Gas", categoryId: "", type: "EXPENSE" }, { name: "x".repeat(81), categoryId: "x", type: "INCOME" }]) expect(() => transactionTitleCreateInput.parse(value)).toThrow();
  });
  it("allows rename, move, archive, and reactivate updates", () => {
    expect(transactionTitleUpdateInput.parse({ name: "Bonus" })).toEqual({ name: "Bonus" });
    expect(transactionTitleUpdateInput.parse({ categoryId: "salary", isActive: false })).toEqual({ categoryId: "salary", isActive: false });
    expect(transactionTitleUpdateInput.parse({ isActive: true })).toEqual({ isActive: true });
    expect(() => transactionTitleUpdateInput.parse({})).toThrow();
  });
});
