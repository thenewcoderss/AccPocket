import type { NextFunction, Request, Response } from "express";

type PerformanceFields = {
  event?: "request" | "export" | "report_detail";
  route: string;
  method?: string;
  status?: number;
  durationMs: number;
  rowCount?: number;
  outputBytes?: number;
  heapDeltaBytes?: number;
  limitReached?: boolean;
};

export function performanceEvent(fields: PerformanceFields) {
  return { level: "info", type: "performance", ...fields, durationMs: Number(fields.durationMs.toFixed(2)) };
}

export function logPerformance(fields: PerformanceFields) {
  try { console.info(JSON.stringify(performanceEvent(fields))); } catch { /* Telemetry must never affect a request. */ }
}

export function performanceTelemetry(route: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = performance.now();
    res.once("finish", () => logPerformance({ event: "request", route, method: req.method, status: res.statusCode, durationMs: performance.now() - start }));
    next();
  };
}
