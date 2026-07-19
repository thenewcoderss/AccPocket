import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Reports route contract", () => {
  it("uses the supported single-request summary endpoint", () => {
    const source = readFileSync(new URL("./Reports.tsx", import.meta.url), "utf8");
    expect(source).toContain("/reports/summary?period=${period}");
    expect(source).not.toContain("api.get<Report>(`/reports?period=");
  });
});
