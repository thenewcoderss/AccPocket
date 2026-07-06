import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { reportData } from "./service.js";

type Report = Awaited<ReturnType<typeof reportData>>;

export function reportFileStem(report: Pick<Report, "period" | "from" | "to">) {
  const inclusiveEnd = new Date(new Date(report.to).getTime() - 1).toISOString().slice(0, 10);
  return `accpocket-${report.period}-${report.from.slice(0, 10)}-to-${inclusiveEnd}`;
}

export function excelMoney(value: string): number | string {
  const significantDigits = value.replace(/^-/, "").replace(".", "").replace(/^0+/, "").length;
  return significantDigits <= 15 ? Number(value) : value;
}

const moneyText = (currency: string, value: string) => `${currency} ${value}`;

export async function buildPdf(report: Report) {
  const doc = new PDFDocument({ size: "A4", margin: 44, info: { Title: "AccPocket Financial Report", Author: "AccPocket" } });
  const chunks: Buffer[] = [];
  doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
  const complete = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  const pageBreak = (height = 60) => { if (doc.y + height > 790) doc.addPage(); };
  const section = (title: string) => { pageBreak(45); doc.moveDown(0.8).fontSize(14).fillColor("#0f172a").text(title); doc.moveDown(0.3); };
  const line = (text: string, color = "#334155") => { pageBreak(28); doc.fontSize(9).fillColor(color).text(text, { lineGap: 2 }); };

  doc.fontSize(22).fillColor("#0f766e").text("AccPocket Financial Report");
  doc.moveDown(0.35).fontSize(9).fillColor("#64748b").text(`${report.owner} | ${report.from.slice(0, 10)} to ${new Date(new Date(report.to).getTime() - 1).toISOString().slice(0, 10)} | ${report.currency}`);
  doc.moveDown().fontSize(11).fillColor("#0f172a");
  for (const [label, value] of [["Total balance", report.totalBalance], ["Income", report.income], ["Expenses", report.expenses], ["Net cash flow", report.netCashFlow]] as const) doc.text(`${label}: ${moneyText(report.currency, value)}`);

  section("Account balances");
  if (!report.accounts.length) line("No active accounts.", "#64748b");
  for (const account of report.accounts) line(`${account.name}: ${moneyText(account.currency, account.balance)}`);

  section("Expense categories");
  if (!report.categories.length) line("No expense transactions in this period.", "#64748b");
  for (const category of report.categories) line(`${category.name}: ${moneyText(report.currency, category.amount)}`);

  section("Biggest expenses");
  if (!report.biggestExpenses.length) line("No expenses in this period.", "#64748b");
  for (const expense of report.biggestExpenses) line(`${expense.date.slice(0, 10)} | ${expense.description} | ${expense.account} | ${moneyText(report.currency, expense.amount)}`);

  section("Transactions");
  if (!report.transactions.length) line("No transactions in this period.", "#64748b");
  for (const row of report.transactions) line(`${row.date.slice(0, 10)} | ${row.type} | ${row.description} | ${row.account} | ${moneyText(report.currency, row.amount)}`);
  pageBreak(45); doc.moveDown().fontSize(8).fillColor("#64748b").text("AccPocket records transactions only and does not move real money. Transfers and goal contributions are excluded from income, expenses, and net cash flow.");
  doc.end();
  return complete;
}

export function buildWorkbook(report: Report) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AccPocket"; workbook.created = new Date();
  const moneyFormat = `"${report.currency}" #,##0.0000;[Red]-"${report.currency}" #,##0.0000`;
  const styleSheet = (sheet: ExcelJS.Worksheet, moneyColumns: number[] = []) => {
    sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    sheet.getRow(1).height = 22;
    for (const column of moneyColumns) sheet.getColumn(column).numFmt = moneyFormat;
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, sheet.columnCount) } };
  };
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ header: "Metric", key: "metric", width: 25 }, { header: "Value", key: "value", width: 24 }];
  summary.addRows([{ metric: "Owner", value: report.owner }, { metric: "Period", value: report.period }, { metric: "From", value: report.from.slice(0, 10) }, { metric: "To", value: new Date(new Date(report.to).getTime() - 1).toISOString().slice(0, 10) }, { metric: "Currency", value: report.currency }, { metric: "Total Balance", value: excelMoney(report.totalBalance) }, { metric: "Income", value: excelMoney(report.income) }, { metric: "Expenses", value: excelMoney(report.expenses) }, { metric: "Net Cash Flow", value: excelMoney(report.netCashFlow) }]);
  styleSheet(summary, [2]);

  const accounts = workbook.addWorksheet("Accounts");
  accounts.columns = [{ header: "Account", key: "name", width: 30 }, { header: "Currency", key: "currency", width: 12 }, { header: "Current Balance", key: "balance", width: 24 }];
  accounts.addRows(report.accounts.map(account => ({ ...account, balance: excelMoney(account.balance) })) as never[]); styleSheet(accounts, [3]);
  if (!report.accounts.length) accounts.addRow({ name: "No active accounts" });

  const categories = workbook.addWorksheet("Categories");
  categories.columns = [{ header: "Expense Category", key: "name", width: 30 }, { header: "Amount", key: "amount", width: 24 }];
  categories.addRows(report.categories.map(category => ({ name: category.name, amount: excelMoney(category.amount) })) as never[]); styleSheet(categories, [2]);
  if (!report.categories.length) categories.addRow({ name: "No expense transactions in this period" });

  const biggest = workbook.addWorksheet("Biggest Expenses");
  biggest.columns = [{ header: "Date", key: "date", width: 14 }, { header: "Description", key: "description", width: 36 }, { header: "Account", key: "account", width: 28 }, { header: "Amount", key: "amount", width: 24 }];
  biggest.addRows(report.biggestExpenses.map(row => ({ ...row, date: new Date(row.date), amount: excelMoney(row.amount) })) as never[]); biggest.getColumn(1).numFmt = "yyyy-mm-dd"; styleSheet(biggest, [4]);
  if (!report.biggestExpenses.length) biggest.addRow({ description: "No expenses in this period" });

  const transactions = workbook.addWorksheet("Transactions");
  transactions.columns = [{ header: "Date", key: "date", width: 14 }, { header: "Type", key: "type", width: 13 }, { header: "Description", key: "description", width: 36 }, { header: "Category", key: "category", width: 22 }, { header: "Account", key: "account", width: 30 }, { header: "Amount", key: "amount", width: 24 }];
  transactions.addRows(report.transactions.map(row => ({ ...row, date: new Date(row.date), amount: excelMoney(row.amount) })) as never[]); transactions.getColumn(1).numFmt = "yyyy-mm-dd"; styleSheet(transactions, [6]);
  if (!report.transactions.length) transactions.addRow({ description: "No transactions in this period" });
  return workbook;
}
