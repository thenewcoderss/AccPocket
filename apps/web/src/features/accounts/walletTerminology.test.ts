import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("wallet terminology", () => {
  it("uses Wallet wording for the finance account feature navigation and account page", () => {
    const shell = readSource("../../app/Shell.tsx");
    const accounts = readSource("./Accounts.tsx");

    expect(shell).toContain('label: "Wallet"');
    expect(shell).not.toContain('label: "Accounts"');
    expect(accounts).toContain('title="Wallet"');
    expect(accounts).toContain("Add wallet");
    expect(accounts).toContain("Wallet name");
    expect(accounts).toContain("Save wallet");
    expect(accounts).not.toContain("Add account");
    expect(accounts).not.toContain("Account name");
    expect(accounts).not.toContain("Save account");
  });

  it("uses wallet wording in transaction, dashboard, planning, and report surfaces", () => {
    const transactions = readSource("../transactions/Transactions.tsx");
    const dashboard = readSource("../dashboard/Dashboard.tsx");
    const planning = readSource("../planning/Planning.tsx");
    const reports = readSource("../reports/Reports.tsx");

    expect(transactions).toContain("From wallet");
    expect(transactions).toContain("To wallet");
    expect(transactions).toContain("Choose wallet");
    expect(dashboard).toContain("Start with a wallet");
    expect(dashboard).toContain("Wallet");
    expect(planning).toContain("Destination wallet");
    expect(planning).toContain("From wallet");
    expect(reports).toContain("Wallet balances");
  });
});
