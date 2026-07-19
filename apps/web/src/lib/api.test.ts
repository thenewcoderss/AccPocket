import { describe, expect, it } from "vitest";
import { downloadError } from "./api";

describe("download errors", () => {
  it("shows structured export-limit messages", async () => {
    const response = new Response(JSON.stringify({ success: false, error: { code: "PDF_EXPORT_ROW_LIMIT_EXCEEDED", message: "Choose a shorter report period and try again." } }), { status: 413, headers: { "content-type": "application/json" } });
    expect((await downloadError(response)).message).toBe("Choose a shorter report period and try again.");
  });

  it("uses a status-aware fallback for non-JSON failures", async () => {
    expect((await downloadError(new Response("proxy error", { status: 502 }))).message).toBe("Download failed (502)");
  });
});
