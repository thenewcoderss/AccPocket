import { describe, expect, it } from "vitest";
import { calculate, roundMoney } from "./money";

describe("money calculator", () => {
  it("rounds results to cents", () => expect(roundMoney(10.005)).toBe(10.01));
  it("performs arithmetic", () => expect(calculate(12.5, "+", 2.25)).toBe(14.75));
  it("rejects division by zero", () => expect(() => calculate(5, "÷", 0)).toThrow());
});
