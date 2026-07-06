import { describe, expect, it } from "vitest";
import { transferInput } from "../src/modules/transfers/validation.js";

const valid = { sourceAccountId: "source", destinationAccountId: "destination", amount: "25.125", date: "2026-07-06", description: " Move to savings " };

describe("transfer input validation", () => {
  it("parses a valid transfer and trims its text", () => {
    const result = transferInput.parse({ ...valid, notes: "  Monthly allocation  " });
    expect(result.amount.toString()).toBe("25.125");
    expect(result.date.toISOString()).toBe("2026-07-06T00:00:00.000Z");
    expect(result.description).toBe("Move to savings");
    expect(result.notes).toBe("Monthly allocation");
  });

  it("rejects zero, negative, malformed, and overflowing amounts", () => {
    for (const amount of ["0", "0.0000", "-1", "01", "1.23456", "1000000000000000", "1e3"]) {
      expect(() => transferInput.parse({ ...valid, amount })).toThrow();
    }
  });

  it("rejects invalid calendar dates and oversized text", () => {
    for (const date of ["not-a-date", "2026-02-30", "2026-7-6", "2026-07-06T12:00:00Z", 0]) {
      expect(() => transferInput.parse({ ...valid, date })).toThrow();
    }
    expect(() => transferInput.parse({ ...valid, description: "a".repeat(121) })).toThrow();
    expect(() => transferInput.parse({ ...valid, notes: "a".repeat(501) })).toThrow();
  });
});
