import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildPdf, buildWorkbook, excelMoney, reportFileStem } from "../src/modules/reports/exporters.js";

const report = {
  owner: "Test User", currency: "BDT", period: "month" as const, from: "2026-07-01T00:00:00.000Z", to: "2026-08-01T00:00:00.000Z",
  income: "1000.1234", expenses: "250.1111", netCashFlow: "750.0123", totalBalance: "999999999999999.9999",
  accounts: [{ name: "Cash", balance: "999999999999999.9999", currency: "BDT" }],
  categories: [{ id: "food", name: "Food", color: "#0f766e", amount: "250.1111" }],
  biggestExpenses: [{ id: "expense", date: "2026-07-02T00:00:00.000Z", description: "Groceries", account: "Cash", amount: "250.1111" }],
  transactions: [{ id: "income", date: "2026-07-01T00:00:00.000Z", type: "INCOME" as const, description: "Salary", category: "Salary", account: "Cash", amount: "1000.1234" }],
  trend: [{ label: "2026-07-01", income: "1000.1234", expense: "0" }]
};

describe("report exporters", () => {
  it("creates stable period-aware filenames and precision-safe Excel values", () => {
    expect(reportFileStem(report)).toBe("accpocket-month-2026-07-01-to-2026-07-31");
    expect(excelMoney("1000.1234")).toBe(1000.1234);
    expect(excelMoney("999999999999999.9999")).toBe("999999999999999.9999");
  });

  it("builds a readable PDF including all report sections", async () => {
    const pdf = await buildPdf(report as never);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1500);
  });

  it("builds all workbook sheets and preserves high-precision decimals", async () => {
    const buffer = await buildWorkbook(report as never).xlsx.writeBuffer();
    const loaded = new ExcelJS.Workbook(); await loaded.xlsx.load(buffer);
    expect(loaded.worksheets.map(sheet => sheet.name)).toEqual(["Summary", "Wallet", "Categories", "Biggest Expenses", "Transactions"]);
    expect(loaded.getWorksheet("Wallet")?.getCell("C2").value).toBe("999999999999999.9999");
    expect(loaded.getWorksheet("Transactions")?.getCell("F2").value).toBe(1000.1234);
  });

  it("keeps empty PDF and Excel exports understandable", async () => {
    const empty = { ...report, accounts: [], categories: [], biggestExpenses: [], transactions: [], trend: [], income: "0", expenses: "0", netCashFlow: "0", totalBalance: "0" };
    expect((await buildPdf(empty as never)).length).toBeGreaterThan(1000);
    const workbook = buildWorkbook(empty as never);
    expect(workbook.getWorksheet("Wallet")?.getCell("A2").value).toBe("No active wallets");
    expect(workbook.getWorksheet("Transactions")?.getCell("C2").value).toBe("No transactions in this period");
  });

});
