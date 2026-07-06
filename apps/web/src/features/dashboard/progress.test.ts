import { describe, expect, it } from "vitest";
import { dashboardProgress } from "./progress";

describe("dashboard progress display", () => {
  it("handles zero, normal, full, and over-target percentages", () => {
    expect(dashboardProgress("0")).toBe(0);
    expect(dashboardProgress("42.75")).toBe(42.75);
    expect(dashboardProgress("100")).toBe(100);
    expect(dashboardProgress("125.25")).toBe(100);
  });

  it("falls back safely for invalid values", () => {
    expect(dashboardProgress("not-a-number")).toBe(0);
  });
});
