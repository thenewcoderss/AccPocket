# PP5 Sprint 1 Performance Baseline

Audit date: 2026-07-19
Environment: Windows local workspace; production frontend on Vercel; production API on Render; PostgreSQL readiness through the deployed API.

## Repeatable commands

```text
pnpm --filter @accpocket/web build
pnpm perf:bundle
pnpm --filter @accpocket/api build
pnpm perf:exports
pnpm typecheck
pnpm test
pnpm build
```

`BENCHMARK_ROWS` may override the synthetic export size from 1 to 100,000. The scripts use generated data, require no credentials, and contain no secrets. They are informational and are not CI gates.

## Baseline measurements

- Web production build: 42.36 seconds.
- Complete web distribution: 1,039,005 raw bytes.
- JavaScript: 984,612 raw bytes.
- Chart chunk: 409,786 raw / 110,675 gzip bytes.
- Root application chunk: 209,682 raw / 63,933 gzip bytes.
- Service-worker precache: 905,387 raw bytes across 24 entries.
- Local Express health: 6.52 ms average, 5.57 ms p50 over 200 requests.
- Local unauthenticated dashboard middleware: 7.26 ms average, 6.95 ms p50 over 100 requests.
- Warm production health responses were mostly 284–514 ms; one cold sample reached the 30-second timeout.
- Production database readiness: approximately 1.0–3.3 seconds.
- 10K-row Excel: 1.24 seconds and approximately 24 MB heap growth.
- 100K-row Excel: 11.49 seconds and approximately 199 MB heap growth.
- 10K-row PDF: 1.45 seconds and approximately 33 MB heap growth.

## Sprint 1 guardrails

- `REPORT_DETAIL_ROW_LIMIT=5000`: caps returned transaction details only. Summary totals, categories, trends, and biggest-expense calculations remain complete for the selected period.
- `PDF_EXPORT_ROW_LIMIT=10000`: larger exports return HTTP 413 with `PDF_EXPORT_ROW_LIMIT_EXCEEDED`.
- `EXCEL_EXPORT_ROW_LIMIT=50000`: larger exports return HTTP 413 with `EXCEL_EXPORT_ROW_LIMIT_EXCEEDED`.

All values are validated as integers from 1 through 1,000,000 at application startup.

## Sprint 1 repeatable-script result

- Vite production build phase: 32.89 seconds.
- Complete web distribution: 1,056,793 raw / 288,792 aggregate gzip bytes.
- Synthetic 10K PDF: 2.25 seconds, 192,811 output bytes, approximately 6.7 MB observed heap growth.
- Synthetic 10K Excel: 2.27 seconds, 273,737 output bytes, approximately 17.3 MB observed heap growth.

Export timings are sensitive to runtime warmup and are not expected to improve in Sprint 1; this sprint adds rejection before generation above the configured limits.

## Compression and caching

Express compresses eligible responses of at least 1 KB. PDF, XLSX, and ZIP-like content is excluded because those formats are already compressed or compression-sensitive. Vercel fingerprinted `/assets/*` files use `public, max-age=31536000, immutable`; `index.html`, `sw.js`, and `manifest.webmanifest` remain revalidated.

## Measurement limitations

- Authenticated production route timings require a non-sensitive staging audit account and were not collected.
- PostgreSQL query plans were not captured because the local database connection was unavailable.
- Lighthouse, browser Web Vitals, and React Profiler measurements require browser automation not installed in this workspace.
- Export benchmarks measure generation only; they exclude database retrieval and network transfer.
