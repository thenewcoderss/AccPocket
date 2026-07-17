import { describe, expect, it } from "vitest";
import { transactionTotalPages } from "./pagination";

describe("transaction pagination", () => {
  it("keeps empty transaction lists on one page", () => {
    expect(transactionTotalPages(0)).toBe(1);
  });

  it("rounds partial pages up", () => {
    expect(transactionTotalPages(31)).toBe(2);
  });
});
