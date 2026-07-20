import { describe, expect, it } from "vitest";
import { accountActions, isArchivedAccount } from "../src/modules/accounts/policy.js";

describe("wallet archive policy", () => {
  it("allows unused wallets to be archived and deleted", () => expect(accountActions(0, 0, 0, false)).toMatchObject({ canArchive: true, canDelete: true }));
  it("allows wallets with transaction history to be archived but not deleted", () => expect(accountActions(2, 0, 0, false)).toMatchObject({ canArchive: true, canDelete: false }));
  it("blocks archive while an active goal uses the wallet", () => expect(accountActions(0, 1, 1, false)).toMatchObject({ canArchive: false, canDelete: false }));
  it("does not make a used archived wallet deletable", () => expect(accountActions(1, 0, 0, true).canDelete).toBe(false));
  it("derives archive state from the timestamp", () => {
    expect(isArchivedAccount({ archivedAt: null })).toBe(false);
    expect(isArchivedAccount({ archivedAt: new Date("2026-07-21T00:00:00Z") })).toBe(true);
  });
});
