import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routes = readFileSync(new URL("../src/modules/finance/routes.ts", import.meta.url), "utf8");
const reports = readFileSync(new URL("../src/modules/reports/service.ts", import.meta.url), "utf8");

describe("wallet archive route contract", () => {
  it("provides authenticated archive and restore routes with ownership checks", () => {
    expect(routes).toContain('financeRouter.use(authenticate, requireUnlock)');
    expect(routes).toContain('patch("/accounts/:id/archive"');
    expect(routes).toContain('patch("/accounts/:id/restore"');
    expect(routes.match(/ownedAccount\(req\.userId!, accountId, prisma, true\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
  it("blocks active goals and makes archive and restore idempotent", () => {
    expect(routes).toContain('status: "ACTIVE"');
    expect(routes).toContain('account.archivedAt ? account : await prisma.account.update');
    expect(routes).toContain('account.archivedAt ? await prisma.account.update');
  });
  it("rejects archived wallets for transactions, transfers, and new goals", () => {
    expect(routes).toContain('Archived wallets cannot be used for new financial activity');
    expect(routes).toContain('Archived wallets cannot be used for transfers');
    expect(routes).toContain('await ownedAccount(req.userId!, input.destinationAccountId)');
  });
  it("keeps history joins and report wallet balances unfiltered", () => {
    expect(routes).toContain('entries: { select: { amount: true, account: { select: { name: true } } } }');
    expect(reports).toContain('prisma.account.findMany({ where: { userId }');
  });
});
