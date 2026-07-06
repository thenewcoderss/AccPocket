import { Router } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { authenticate, requireUnlock } from "../../middleware/security.js";
import { asyncRoute } from "../../utils/errors.js";
import { reportData } from "./service.js";
import { reportQuery } from "./query.js";

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireUnlock);
reportsRouter.get("/summary", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: await reportData(req.userId!, query.period, query.from, query.to) }); }));
reportsRouter.get("/trends", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: (await reportData(req.userId!, query.period, query.from, query.to)).trend }); }));
reportsRouter.get("/categories", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: (await reportData(req.userId!, query.period, query.from, query.to)).categories }); }));

reportsRouter.get("/export/pdf", asyncRoute(async (req, res) => {
  const q = reportQuery.parse(req.query); const report = await reportData(req.userId!, q.period, q.from, q.to);
  const filename = `accpocket-${q.period}-report.pdf`;
  res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  const doc = new PDFDocument({ size: "A4", margin: 48 }); doc.pipe(res);
  doc.fontSize(22).fillColor("#0f766e").text("AccPocket Financial Report");
  doc.moveDown().fontSize(10).fillColor("#475569").text(`${report.owner} • ${report.from.slice(0, 10)} to ${report.to.slice(0, 10)} • ${report.currency}`);
  doc.moveDown().fontSize(13).fillColor("#0f172a").text(`Total balance: ${report.totalBalance}`).text(`Income: ${report.income}`).text(`Expenses: ${report.expenses}`).text(`Net cash flow: ${report.netCashFlow}`);
  doc.moveDown().fontSize(16).text("Transactions");
  for (const row of report.transactions) { if (doc.y > 740) doc.addPage(); doc.fontSize(9).fillColor("#334155").text(`${row.date.slice(0, 10)}   ${row.type.padEnd(8)}   ${row.description}   ${row.amount}`); }
  doc.moveDown().fontSize(8).fillColor("#64748b").text(`Generated ${new Date().toISOString()}. AccPocket records transactions only and does not move real money.`);
  doc.end();
}));

reportsRouter.get("/export/excel", asyncRoute(async (req, res) => {
  const q = reportQuery.parse(req.query); const report = await reportData(req.userId!, q.period, q.from, q.to);
  const workbook = new ExcelJS.Workbook(); workbook.creator = "AccPocket";
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [{ header: "Metric", key: "metric", width: 24 }, { header: "Value", key: "value", width: 20 }];
  summary.addRows([{ metric: "Owner", value: report.owner }, { metric: "Currency", value: report.currency }, { metric: "Total Balance", value: Number(report.totalBalance) }, { metric: "Income", value: Number(report.income) }, { metric: "Expenses", value: Number(report.expenses) }, { metric: "Net Cash Flow", value: Number(report.netCashFlow) }]);
  summary.getRow(1).font = { bold: true }; summary.getColumn(2).numFmt = "#,##0.00";
  const detail = workbook.addWorksheet("Transactions");
  detail.columns = [{ header: "Date", key: "date", width: 14 }, { header: "Type", key: "type", width: 12 }, { header: "Description", key: "description", width: 32 }, { header: "Category", key: "category", width: 20 }, { header: "Account", key: "account", width: 20 }, { header: "Amount", key: "amount", width: 16 }];
  detail.addRows(report.transactions.map(t => ({ ...t, date: new Date(t.date), amount: Number(t.amount) }))); detail.getRow(1).font = { bold: true }; detail.getColumn(1).numFmt = "yyyy-mm-dd"; detail.getColumn(6).numFmt = "#,##0.00";
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", `attachment; filename=\"accpocket-${q.period}-report.xlsx\"`);
  await workbook.xlsx.write(res); res.end();
}));
