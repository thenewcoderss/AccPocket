import { describe, expect, it } from "vitest";
import { localDateInputValue } from "./date";

describe("transaction date input", () => {
  it("uses local calendar components instead of the UTC date", () => {
    expect(localDateInputValue(new Date(2026, 0, 2, 0, 30))).toBe("2026-01-02");
  });
});
