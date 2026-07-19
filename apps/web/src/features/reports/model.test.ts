import { describe, expect, it } from "vitest";
import { reportLimitMessage } from "./model";

describe("report detail limit message", () => {
  it("clearly distinguishes limited detail from complete totals", () => {
    expect(reportLimitMessage({ total: 7_500, returned: 5_000, limit: 5_000, limited: true })).toContain("Showing 5,000 of 7,500 transactions");
    expect(reportLimitMessage({ total: 7_500, returned: 5_000, limit: 5_000, limited: true })).toContain("totals and charts still include the complete selected period");
    expect(reportLimitMessage({ total: 5_000, returned: 5_000, limit: 5_000, limited: false })).toBeNull();
  });
});
