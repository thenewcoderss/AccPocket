import { describe, expect, it, vi } from "vitest";
import { createCorsOriginValidator, isAllowedOrigin } from "../src/config/cors.js";

const productionOrigin = "https://acc-pocket-api.vercel.app";

describe("API CORS origin validation", () => {
  it("accepts the configured production origin", () => {
    expect(isAllowedOrigin(productionOrigin, productionOrigin, "production")).toBe(true);
  });

  it("accepts AccPocket preview deployments from the configured Vercel team", () => {
    expect(isAllowedOrigin("https://acc-pocket-api-git-feature-transaction-titles-saadignity94-gmailcoms-projects.vercel.app", productionOrigin, "production")).toBe(true);
    expect(isAllowedOrigin("https://acc-pocket-api-a1b2c3d4-saadignity94-gmailcoms-projects.vercel.app", productionOrigin, "production")).toBe(true);
  });

  it("rejects unrelated and lookalike origins", () => {
    for (const origin of [
      "https://malicious.example",
      "https://acc-pocket-api-attacker.vercel.app",
      "https://acc-pocket-api-a1b2c3d4-other-team.vercel.app",
      "http://acc-pocket-api-a1b2c3d4-saadignity94-gmailcoms-projects.vercel.app",
      "https://acc-pocket-api-a1b2c3d4-saadignity94-gmailcoms-projects.vercel.app.evil.example"
    ]) expect(isAllowedOrigin(origin, productionOrigin, "production")).toBe(false);
  });

  it("keeps local Vite development origins out of production", () => {
    expect(isAllowedOrigin("http://localhost:5173", productionOrigin, "development")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:4173", productionOrigin, "test")).toBe(true);
    expect(isAllowedOrigin("http://localhost:5173", productionOrigin, "production")).toBe(false);
  });

  it("allows requests without an Origin header as before", () => {
    expect(isAllowedOrigin(undefined, productionOrigin, "production")).toBe(true);
    const callback = vi.fn();
    createCorsOriginValidator(productionOrigin, "production")(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
