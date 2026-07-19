import { describe, expect, it } from "vitest";
import { performanceEvent } from "../src/middleware/performance.js";

describe("performance telemetry", () => {
  it("emits normalized non-sensitive fields", () => {
    const event = performanceEvent({ event: "export", route: "reports.export.pdf", method: "GET", status: 200, durationMs: 12.345, rowCount: 10, outputBytes: 500, heapDeltaBytes: 100, limitReached: false });
    expect(event).toEqual({ level: "info", type: "performance", event: "export", route: "reports.export.pdf", method: "GET", status: 200, durationMs: 12.35, rowCount: 10, outputBytes: 500, heapDeltaBytes: 100, limitReached: false });
    expect(JSON.stringify(event)).not.toMatch(/token|password|passcode|description|notes|email|query/i);
  });
});
