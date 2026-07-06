import { describe, expect, it } from "vitest";
import { formatTransactionDate, localDateInputValue } from "./date";

describe("transaction date input", () => {
  it("uses local calendar components instead of the UTC date", () => {
    expect(localDateInputValue(new Date(2026, 0, 2, 0, 30))).toBe("2026-01-02");
  });

  it("formats the stored calendar date without a timezone day shift", () => {
    const formatted = formatTransactionDate("2026-07-06T00:00:00.000Z", "en-CA");
    expect(formatted).toContain("Jul");
    expect(formatted).toContain("6");
  });
});
