import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { goalInput, goalProgress, goalUpdateInput } from "../src/modules/goals/validation.js";

const valid = { destinationAccountId: "account-1", type: "SAVINGS", name: " New laptop ", targetAmount: "1000.5000", targetDate: "2026-12-31" };

describe("goal validation and progress", () => {
  it("accepts both goal types and trims names", () => {
    expect(goalInput.parse(valid).name).toBe("New laptop");
    expect(goalInput.parse({ ...valid, type: "EMERGENCY_FUND" }).type).toBe("EMERGENCY_FUND");
    expect(goalInput.parse(valid).targetDate?.toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("rejects invalid amounts, dates, and names", () => {
    for (const targetAmount of ["0", "-1", "01", "1.23456", "1000000000000000", "1e3"]) expect(() => goalInput.parse({ ...valid, targetAmount })).toThrow();
    for (const targetDate of ["2026-02-30", "2026-1-01", "not-a-date", 0]) expect(() => goalInput.parse({ ...valid, targetDate })).toThrow();
    expect(() => goalInput.parse({ ...valid, name: "   " })).toThrow();
    expect(() => goalInput.parse({ ...valid, name: "a".repeat(81) })).toThrow();
  });

  it("allows a target date to be cleared during an update", () => {
    expect(goalUpdateInput.parse({ targetDate: null })).toEqual({ targetDate: null });
  });

  it("calculates zero, normal, full, and over-target progress with decimals", () => {
    const target = new Prisma.Decimal("100.10");
    expect(goalProgress(target, new Prisma.Decimal(0))).toEqual({ remaining: "100.1", overBy: "0", percentage: "0" });
    expect(goalProgress(target, new Prisma.Decimal("50.05"))).toEqual({ remaining: "50.05", overBy: "0", percentage: "50" });
    expect(goalProgress(target, new Prisma.Decimal("100.10"))).toEqual({ remaining: "0", overBy: "0", percentage: "100" });
    expect(goalProgress(target, new Prisma.Decimal("125.125"))).toEqual({ remaining: "0", overBy: "25.025", percentage: "125" });
  });
});
