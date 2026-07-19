import { AppError } from "../../utils/errors.js";

export type ReportDetailLimit = { total: number; returned: number; limit: number; limited: boolean };

export function reportDetailLimit(total: number, limit: number): ReportDetailLimit {
  return { total, returned: Math.min(total, limit), limit, limited: total > limit };
}

export function assertExportRowLimit(format: "PDF" | "EXCEL", count: number, limit: number) {
  if (count <= limit) return;
  throw new AppError(413, `${format}_EXPORT_ROW_LIMIT_EXCEEDED`, `${format === "PDF" ? "PDF" : "Excel"} exports are limited to ${limit.toLocaleString("en-US")} transactions. Choose a shorter report period and try again.`);
}
