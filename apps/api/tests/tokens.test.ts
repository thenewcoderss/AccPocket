import { describe, expect, it } from "vitest";
import { signAccess, signRefresh, signUnlock, verifyAccess, verifyRefresh, verifyUnlock } from "../src/services/tokens.js";

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
