import { describe, expect, it } from "vitest";

process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/accpocket_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-value-32-chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-value-32-chars";
process.env.JWT_UNLOCK_SECRET = "test-unlock-secret-value-32-chars";

const { signAccess, signRefresh, signUnlock, verifyAccess, verifyRefresh, verifyUnlock } = await import("../src/services/tokens.js");

describe("authentication tokens", () => {
  it("signs purpose-specific access, refresh, and unlock claims", () => {
    expect(verifyAccess(signAccess("user-1"))).toMatchObject({ sub: "user-1", kind: "access" });
    expect(verifyRefresh(signRefresh("user-1", "session-1", "family-1"))).toMatchObject({ sub: "user-1", sid: "session-1", fid: "family-1", kind: "refresh" });
    expect(verifyUnlock(signUnlock("user-1"))).toMatchObject({ sub: "user-1", kind: "unlock" });
  });

  it("rejects a token verified with the wrong purpose secret", () => {
    expect(() => verifyRefresh(signAccess("user-1"))).toThrow();
    expect(() => verifyUnlock(signRefresh("user-1", "session-1", "family-1"))).toThrow();
  });
});
