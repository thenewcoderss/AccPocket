import { describe, expect, it } from "vitest";
import { fitsMoneyColumn, signedTransactionAmount, transactionInput } from "../src/modules/transactions/validation.js";

const valid = { accountId: "account-1", titleId: "title-1", type: "INCOME", amount: "10.25", date: "2026-07-06", description: " Salary " };

describe("transaction input validation", () => {
  it("accepts income and expense transactions and trims text", () => {
    expect(transactionInput.parse(valid).description).toBe("Salary");
    expect(transactionInput.parse({ ...valid, type: "EXPENSE", notes: "  Optional note  " }).notes).toBe("Optional note");
  });

  it("accepts an empty or omitted optional description", () => {
    expect(transactionInput.parse({ ...valid, description: "" }).description).toBe("");
    const { description: _description, ...withoutDescription } = valid;
    expect(transactionInput.parse(withoutDescription).description).toBe("");
  });

  it("applies the correct ledger sign", () => {
    const amount = transactionInput.parse(valid).amount;
    expect(signedTransactionAmount("INCOME", amount).toString()).toBe("10.25");
    expect(signedTransactionAmount("EXPENSE", amount).toString()).toBe("-10.25");
  });

  it("detects resulting balances outside Decimal(19,4)", () => {
    const maximum = transactionInput.parse({ ...valid, amount: "999999999999999.9999" }).amount;
    expect(fitsMoneyColumn(maximum)).toBe(true);
    expect(fitsMoneyColumn(maximum.add("0.0001"))).toBe(false);
  });

  it("rejects zero, negative, malformed, and database-overflowing amounts", () => {
    for (const amount of ["0", "0.00", "-1", "01", "1.23456", "1000000000000000", "1e3"]) expect(() => transactionInput.parse({ ...valid, amount })).toThrow();
  });

  it("rejects invalid dates and text beyond storage limits", () => {
    for (const date of ["not-a-date", "2026-02-30", "2026-7-6", "2026-07-06T12:00:00Z", 0]) {
      expect(() => transactionInput.parse({ ...valid, date })).toThrow();
    }
    expect(() => transactionInput.parse({ ...valid, description: "a".repeat(121) })).toThrow();
    expect(() => transactionInput.parse({ ...valid, notes: "a".repeat(501) })).toThrow();
  });

  it("stores a calendar date at UTC midnight", () => {
    expect(transactionInput.parse(valid).date.toISOString()).toBe("2026-07-06T00:00:00.000Z");
  });
});
