import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { rangeFor } from "../src/modules/reports/service.js";

describe("report period boundaries", () => {
  it("uses the user's timezone for a calendar day", () => {
    const at = DateTime.fromISO("2026-07-04T18:30:00Z");
    const range = rangeFor("day", "Asia/Dhaka", at);
    expect(range.start.toISOString()).toBe("2026-07-04T18:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-05T18:00:00.000Z");
  });

  it("creates a non-overlapping calendar month", () => {
    const range = rangeFor("month", "UTC", DateTime.fromISO("2026-07-15T12:00:00Z"));
    expect(range.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});
