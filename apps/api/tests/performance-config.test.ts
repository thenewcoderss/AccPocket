import { describe, expect, it } from "vitest";
import { performanceLimit } from "../src/config/env.js";

describe("performance limit configuration", () => {
  it("accepts safe positive integer limits and rejects unsafe values", () => {
    expect(performanceLimit.parse("5000")).toBe(5000);
    for (const value of ["0", "1.5", "1000001", "invalid"]) expect(() => performanceLimit.parse(value)).toThrow();
  });
});
