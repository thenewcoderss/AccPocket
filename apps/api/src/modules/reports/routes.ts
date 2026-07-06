import { Router } from "express";
import { authenticate, requireUnlock } from "../../middleware/security.js";
import { asyncRoute } from "../../utils/errors.js";
import { reportData } from "./service.js";
import { reportQuery } from "./query.js";
import { buildPdf, buildWorkbook, reportFileStem } from "./exporters.js";

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireUnlock);
reportsRouter.get("/summary", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: await reportData(req.userId!, query.period, query.from, query.to) }); }));
reportsRouter.get("/trends", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: (await reportData(req.userId!, query.period, query.from, query.to)).trend }); }));
reportsRouter.get("/categories", asyncRoute(async (req, res) => { const query = reportQuery.parse(req.query); res.json({ success: true, data: (await reportData(req.userId!, query.period, query.from, query.to)).categories }); }));

reportsRouter.get("/export/pdf", asyncRoute(async (req, res) => {
  const q = reportQuery.parse(req.query); const report = await reportData(req.userId!, q.period, q.from, q.to);
  const filename = `${reportFileStem(report)}.pdf`;
  res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  res.end(await buildPdf(report));
}));

reportsRouter.get("/export/excel", asyncRoute(async (req, res) => {
  const q = reportQuery.parse(req.query); const report = await reportData(req.userId!, q.period, q.from, q.to);
  const workbook = buildWorkbook(report);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", `attachment; filename=\"${reportFileStem(report)}.xlsx\"`);
  await workbook.xlsx.write(res); res.end();
}));
