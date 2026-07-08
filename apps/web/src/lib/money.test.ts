import { describe, expect, it } from "vitest";
import { calculate, roundMoney } from "./money";

describe("money calculator", () => {
  it("rounds results to cents", () => expect(roundMoney(10.005)).toBe(10.01));
  it("performs arithmetic", () => {
    expect(calculate(12.5, "+", 2.25)).toBe(14.75);
    expect(calculate(12.5, "\u2212", 2.25)).toBe(10.25);
    expect(calculate(12.5, "\u00d7", 2)).toBe(25);
    expect(calculate(12.5, "\u00f7", 2)).toBe(6.25);
  });
  it("rejects division by zero and unknown operators", () => {
    expect(() => calculate(5, "\u00f7", 0)).toThrow("Cannot divide by zero");
    expect(() => calculate(5, "%", 2)).toThrow("Invalid monetary result");
  });
});
