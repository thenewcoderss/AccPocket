import { describe, expect, it } from "vitest";
import { formatMoney } from "./ui";

describe("formatMoney", () => {
  it("formats normal money values with the current locale", () => {
    expect(formatMoney("1234.5", "BDT")).toContain("1,234.5");
  });

  it("does not coerce high-precision Decimal strings through Number", () => {
    expect(formatMoney("999999999999999.9999", "BDT")).toBe("BDT 999,999,999,999,999.9999");
    expect(formatMoney("-999999999999999.9999", "BDT")).toBe("-BDT 999,999,999,999,999.9999");
  });
});
