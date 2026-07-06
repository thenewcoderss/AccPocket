import type { AccountDto } from "@accpocket/shared";
import { describe, expect, it } from "vitest";
import { activeAccounts, canAddEntry, canTransfer, contributionAccounts } from "./accountRequirements";

function account(id: string, archived = false): AccountDto {
  return { id, name: id, type: "CASH", openingBalance: "0", currentBalance: "0", currency: "BDT", archived };
}

describe("account requirements", () => {
  it("requires an active account for entries", () => {
    expect(canAddEntry([])).toBe(false);
    expect(canAddEntry([account("archived", true)])).toBe(false);
    expect(canAddEntry([account("cash")])).toBe(true);
  });
  it("requires two active accounts for transfers", () => {
    expect(canTransfer([account("cash")])).toBe(false);
    expect(canTransfer([account("cash"), account("old", true)])).toBe(false);
    expect(canTransfer([account("cash"), account("bank")])).toBe(true);
  });
  it("excludes archived and destination accounts from contributions", () => {
    const accounts = [account("goal"), account("cash"), account("old", true)];
    expect(activeAccounts(accounts).map(item => item.id)).toEqual(["goal", "cash"]);
    expect(contributionAccounts(accounts, "goal").map(item => item.id)).toEqual(["cash"]);
  });
});
