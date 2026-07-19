import { describe, expect, it } from "vitest";
import { AppError } from "../src/utils/errors.js";
import { assertExportRowLimit, reportDetailLimit } from "../src/modules/reports/limits.js";

describe("report performance guardrails", () => {
  it("marks limited detail without changing the complete total", () => {
    expect(reportDetailLimit(7_500, 5_000)).toEqual({ total: 7_500, returned: 5_000, limit: 5_000, limited: true });
    expect(reportDetailLimit(5_000, 5_000)).toEqual({ total: 5_000, returned: 5_000, limit: 5_000, limited: false });
  });

  it.each(["PDF", "EXCEL"] as const)("allows %s exports below and at the limit", format => {
    expect(() => assertExportRowLimit(format, 9_999, 10_000)).not.toThrow();
    expect(() => assertExportRowLimit(format, 10_000, 10_000)).not.toThrow();
  });

  it.each([["PDF", "PDF_EXPORT_ROW_LIMIT_EXCEEDED"], ["EXCEL", "EXCEL_EXPORT_ROW_LIMIT_EXCEEDED"]] as const)("rejects oversized %s exports with a structured error", (format, code) => {
    try { assertExportRowLimit(format, 10_001, 10_000); throw new Error("Expected export rejection"); }
    catch (error) { expect(error).toBeInstanceOf(AppError); expect(error).toMatchObject({ status: 413, code }); }
  });
});
