import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const exporter = resolve("apps/api/dist/modules/reports/exporters.js");
if (!existsSync(exporter)) throw new Error("Build apps/api first with `pnpm --filter @accpocket/api build`.");
const { buildPdf, buildWorkbook } = await import(pathToFileURL(exporter).href);
const count = Number(process.env.BENCHMARK_ROWS ?? 10_000);
if (!Number.isInteger(count) || count < 1 || count > 100_000) throw new Error("BENCHMARK_ROWS must be an integer from 1 to 100000.");
const transactions = Array.from({ length: count }, (_, index) => ({ id: String(index), date: "2026-07-01T00:00:00.000Z", type: index % 3 ? "EXPENSE" : "INCOME", title: `Title ${index % 50}`, description: `Benchmark ${index}`, category: `Category ${index % 20}`, account: "Cash", amount: "123.45" }));
const report = { owner: "Local benchmark", currency: "BDT", period: "month", from: "2026-07-01T00:00:00.000Z", to: "2026-08-01T00:00:00.000Z", income: "0", expenses: "0", netCashFlow: "0", totalBalance: "0", accounts: [{ name: "Cash", balance: "0", currency: "BDT" }], categories: [], biggestExpenses: transactions.slice(0, 5), transactions, detail: { total: count, returned: count, limit: count, limited: false }, trend: [] };
for (const format of ["pdf", "excel"]) {
  const heapBefore = process.memoryUsage().heapUsed, started = performance.now();
  const output = format === "pdf" ? await buildPdf(report) : await buildWorkbook(report).xlsx.writeBuffer();
  console.log(JSON.stringify({ format, rows: count, durationMs: Number((performance.now() - started).toFixed(2)), outputBytes: output.length ?? output.byteLength, heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore }));
}
