import { describe, expect, it } from "vitest";
import { accountInput, accountTypes } from "../src/modules/accounts/validation.js";

describe("account input validation", () => {
  it("accepts every supported account type and trims names", () => {
    for (const type of accountTypes) {
      const result = accountInput.parse({ name: "  Main account  ", type, openingBalance: "10.25" });
      expect(result.name).toBe("Main account");
      expect(result.openingBalance.toString()).toBe("10.25");
    }
  });

  it("defaults the opening balance to zero", () => {
    expect(accountInput.parse({ name: "Cash", type: "CASH" }).openingBalance.toString()).toBe("0");
  });

  it("rejects blank or oversized names", () => {
    expect(() => accountInput.parse({ name: "   ", type: "CASH" })).toThrow();
    expect(() => accountInput.parse({ name: "a".repeat(61), type: "CASH" })).toThrow();
  });

  it("rejects negative, malformed, and database-overflowing balances", () => {
    for (const openingBalance of ["-1", "01", "1.23456", "1000000000000000", "1e3"]) {
      expect(() => accountInput.parse({ name: "Cash", type: "CASH", openingBalance })).toThrow();
    }
  });
});
