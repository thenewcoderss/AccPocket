import { Router } from "express";
import { env } from "../../config/env.js";
import { logPerformance, performanceTelemetry } from "../../middleware/performance.js";
import { authenticate, requireUnlock } from "../../middleware/security.js";
import { asyncRoute } from "../../utils/errors.js";
import { buildPdf, buildWorkbook, reportFileStem } from "./exporters.js";
import { assertExportRowLimit } from "./limits.js";
import { reportQuery } from "./query.js";
import { reportData, reportTransactionCount } from "./service.js";

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireUnlock);

reportsRouter.get("/summary", performanceTelemetry("reports.summary"), asyncRoute(async (req, res) => {
  const query = reportQuery.parse(req.query);
  res.json({ success: true, data: await reportData(req.userId!, query.period, query.from, query.to, env.REPORT_DETAIL_ROW_LIMIT) });
}));
reportsRouter.get("/trends", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: (await reportData(req.userId!, query.period, query.from, query.to)).trend }); }));
reportsRouter.get("/categories", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: (await reportData(req.userId!, query.period, query.from, query.to)).categories }); }));

reportsRouter.get("/export/pdf", performanceTelemetry("reports.export.pdf"), asyncRoute(async (req, res) => {
  const started = performance.now(), heapBefore = process.memoryUsage().heapUsed;
  const query = reportQuery.parse(req.query), rowCount = await reportTransactionCount(req.userId!, query.period, query.from, query.to);
  if (rowCount > env.PDF_EXPORT_ROW_LIMIT) logPerformance({ event: "export", route: "reports.export.pdf", durationMs: performance.now() - started, rowCount, heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore, limitReached: true });
  assertExportRowLimit("PDF", rowCount, env.PDF_EXPORT_ROW_LIMIT);
  const report = await reportData(req.userId!, query.period, query.from, query.to, env.PDF_EXPORT_ROW_LIMIT);
  const filename = `${reportFileStem(report)}.pdf`;
  res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  const output = await buildPdf(report);
  logPerformance({ event: "export", route: "reports.export.pdf", durationMs: performance.now() - started, rowCount, outputBytes: output.length, heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore, limitReached: false });
  res.end(output);
}));

reportsRouter.get("/export/excel", performanceTelemetry("reports.export.excel"), asyncRoute(async (req, res) => {
  const started = performance.now(), heapBefore = process.memoryUsage().heapUsed;
  const query = reportQuery.parse(req.query), rowCount = await reportTransactionCount(req.userId!, query.period, query.from, query.to);
  if (rowCount > env.EXCEL_EXPORT_ROW_LIMIT) logPerformance({ event: "export", route: "reports.export.excel", durationMs: performance.now() - started, rowCount, heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore, limitReached: true });
  assertExportRowLimit("EXCEL", rowCount, env.EXCEL_EXPORT_ROW_LIMIT);
  const report = await reportData(req.userId!, query.period, query.from, query.to, env.EXCEL_EXPORT_ROW_LIMIT);
  const workbook = buildWorkbook(report);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", `attachment; filename="${reportFileStem(report)}.xlsx"`);
  await workbook.xlsx.write(res);
  logPerformance({ event: "export", route: "reports.export.excel", durationMs: performance.now() - started, rowCount, heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore, limitReached: false });
  res.end();
}));
