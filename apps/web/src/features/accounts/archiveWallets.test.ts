import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Accounts.tsx", import.meta.url), "utf8");

describe("wallet archive management UI", () => {
  it("requests archived wallets for management and renders separate sections", () => {
    expect(source).toContain("/accounts?includeArchived=true");
    expect(source).toContain("Archived wallets");
    expect(source).toContain("border-dashed bg-slate-50");
  });
  it("provides archive and restore actions with confirmation text", () => {
    expect(source).toContain("/archive");
    expect(source).toContain("/restore");
    expect(source).toContain("Existing transactions and reports will remain unchanged");
    expect(source).toContain("available for new transactions and transfers again");
  });
  it("shows server-provided disabled reasons and keeps delete safeguards", () => {
    expect(source).toContain("archiveBlockedReason");
    expect(source).toContain("disabled={!account.canArchive}");
    expect(source).toContain("disabled={!account.canDelete}");
    expect(source).toContain("deleteBlockedReason");
  });
});
