import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { responseCompression, shouldCompress } from "../src/middleware/compression.js";

const mockRequest = { headers: {} } as never;
const response = (contentType: string) => ({ getHeader: (name: string) => name === "Content-Type" ? contentType : undefined }) as never;

describe("response compression", () => {
  it("compresses eligible JSON and skips already-compressed downloads", () => {
    expect(shouldCompress(mockRequest, response("application/json; charset=utf-8"))).toBe(true);
    expect(shouldCompress(mockRequest, response("application/pdf"))).toBe(false);
    expect(shouldCompress(mockRequest, response("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))).toBe(false);
    expect(shouldCompress(mockRequest, response("application/zip"))).toBe(false);
  });

  it("adds gzip content encoding to a sufficiently large JSON response", async () => {
    const app = express(); app.use(responseCompression); app.get("/json", (_req, res) => res.json({ value: "x".repeat(4_000) }));
    const result = await request(app).get("/json").set("accept-encoding", "gzip");
    expect(result.status).toBe(200);
    expect(result.headers["content-encoding"]).toBe("gzip");
    expect(result.headers.vary).toContain("Accept-Encoding");
  });
});
