import { describe, expect, it } from "vitest";
import { signedTransactionAmount, transactionInput } from "../src/modules/transactions/validation.js";

const valid = { accountId: "account-1", type: "INCOME", amount: "10.25", date: "2026-07-06", description: " Salary " };

describe("transaction input validation", () => {
  it("accepts income and expense transactions and trims text", () => {
    expect(transactionInput.parse(valid).description).toBe("Salary");
    expect(transactionInput.parse({ ...valid, type: "EXPENSE", notes: "  Optional note  " }).notes).toBe("Optional note");
  });

  it("applies the correct ledger sign", () => {
    const amount = transactionInput.parse(valid).amount;
    expect(signedTransactionAmount("INCOME", amount).toString()).toBe("10.25");
    expect(signedTransactionAmount("EXPENSE", amount).toString()).toBe("-10.25");
  });

  it("rejects zero, negative, malformed, and database-overflowing amounts", () => {
    for (const amount of ["0", "0.00", "-1", "01", "1.23456", "1000000000000000", "1e3"]) expect(() => transactionInput.parse({ ...valid, amount })).toThrow();
  });

  it("rejects invalid dates and text beyond storage limits", () => {
    expect(() => transactionInput.parse({ ...valid, date: "not-a-date" })).toThrow();
    expect(() => transactionInput.parse({ ...valid, description: "a".repeat(121) })).toThrow();
    expect(() => transactionInput.parse({ ...valid, notes: "a".repeat(501) })).toThrow();
  });
});
