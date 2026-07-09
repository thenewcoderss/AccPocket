# AccPocket Phoenix 17 Step 17 Launch and Maintenance Plan

AccPocket V1 is a finance tracking and small bookkeeping app only. It records user-owned accounts, income, expenses, internal transfers, budgets, savings goals, and reports. It does not move real money, pay bills, sync banks, approve loans, provide investment advice, or make financial decisions.

This document is a launch and maintenance plan. It does not authorize deployment changes, database schema changes, feature additions, AI integration, banking integration, payment integration, SMS automation, OAuth, MFA, or password reset implementation.

## 1. Local live demo setup

1. Work only from `D:\AccPocketBackup`.
2. Copy `.env.example` to `.env`.
3. Fill in valid local or Supabase PostgreSQL connection values and strong secrets.
4. Generate Prisma client.
5. Run local migrations against the selected database.
6. Start the web and API apps.
7. Open the web app and complete a manual click-through demo.
8. If normal Windows Node/pnpm fails locally, use the known bundled runtime workaround with `gnode.exe` plus `pnpm.mjs`.

Recommended local command sequence:

```powershell
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

If the Windows runtime issue appears, use the previously validated project-specific bundled Node/pnpm workaround instead of changing app code.

## 2. Required .env variables

Required API/server values:

1. `DATABASE_URL`
   - PostgreSQL connection string.
   - Use Supabase PostgreSQL for production or live demo.

2. `NODE_ENV`
   - `development` locally.
   - `production` for deployed backend.

3. `JWT_ACCESS_SECRET`
   - Unique high-entropy secret.
   - Do not reuse example values.

4. `JWT_REFRESH_SECRET`
   - Unique high-entropy secret.
   - Must differ from access and unlock secrets.

5. `JWT_UNLOCK_SECRET`
   - Unique high-entropy secret for short-lived unlock token signing.
   - Must differ from access and refresh secrets.

6. `WEB_ORIGIN`
   - Exact frontend origin allowed by the backend.
   - Example local value: `http://localhost:5173`.
   - Example production shape: `https://your-frontend-domain.example`.

7. `PORT`
   - Backend port.
   - Example local value: `4000`.

Required frontend value:

1. `VITE_API_URL`
   - Public API base URL used by the web app.
   - Example local value: `http://localhost:4000/api/v1`.
   - Example production shape: `https://your-api-domain.example/api/v1`.

Production secret rules:

1. Never commit `.env`.
2. Never use `.env.example` placeholder secrets.
3. Keep access, refresh, and unlock secrets separate.
4. Rotate secrets if they are exposed in logs, screenshots, chat, or demos.

## 3. Supabase PostgreSQL setup reminder

1. Create or select the Supabase project for AccPocket V1.
2. Copy the PostgreSQL connection string into `DATABASE_URL`.
3. Confirm the connection string uses the correct database, user, password, host, and SSL requirements.
4. Keep Supabase credentials out of source control.
5. Confirm the deployment environment can reach Supabase.
6. Run Prisma generation and deploy migrations after setting the environment.
7. Back up or snapshot the database before destructive maintenance actions.

## 4. Prisma migration/deploy steps

Local development or local demo:

```powershell
pnpm db:generate
pnpm db:migrate
```

Production or live demo deployment:

```powershell
pnpm db:generate
pnpm db:migrate:deploy
```

Migration checklist:

1. Confirm `DATABASE_URL` points to the intended database.
2. Confirm the current migration files are committed and reviewed.
3. Run `pnpm db:migrate:deploy` once per production deployment.
4. Confirm the API starts after migration.
5. Run the production smoke test checklist.

Do not change the schema as part of Step 17.

## 5. Frontend deployment plan

1. Deploy `apps/web` as the Vite/React frontend.
2. Set `VITE_API_URL` to the deployed backend API base URL ending in `/api/v1`.
3. Build using the repository package scripts.
4. Confirm the built frontend loads over HTTPS.
5. Confirm login/register flows can call the deployed API.
6. Confirm PWA assets load without blocking core usage.
7. Treat the current Vite chunk-size warning as non-blocking for V1 unless it causes real load or demo issues.

Frontend launch gate:

1. App opens on the deployed URL.
2. No blank screen.
3. API requests target the deployed backend, not localhost.
4. Authenticated routes work after login.
5. Mobile viewport is usable for demo workflows.

## 6. Backend deployment plan

1. Deploy `apps/api` as the Express/Prisma backend.
2. Set all required backend environment variables.
3. Run Prisma client generation during build or release setup.
4. Run Prisma deploy migrations against Supabase PostgreSQL.
5. Start the API using the production start script.
6. Confirm health by exercising real API routes through the frontend or an authenticated smoke test.
7. Confirm cookies, CORS, rate limits, and security headers behave correctly in the deployed environment.

Backend launch gate:

1. API process starts cleanly.
2. Database connection succeeds.
3. Auth endpoints work.
4. Protected financial endpoints require authentication.
5. Passcode-protected financial endpoints require the short-lived unlock token when passcode protection is enabled.
6. Refresh-token rotation remains functional.

## 7. CORS, WEB_ORIGIN, and VITE_API_URL checklist

1. `WEB_ORIGIN` must exactly match the deployed frontend origin.
2. `VITE_API_URL` must point to the deployed backend API base URL.
3. Frontend must not call localhost in production.
4. Backend CORS must allow the frontend origin and credentials as required.
5. Cookies must work over HTTPS in production.
6. Browser devtools should show no CORS failures during login, refresh, and financial API calls.
7. If using preview URLs, update `WEB_ORIGIN` or use a controlled preview environment strategy.

## 8. Production smoke test checklist

Run after production environment setup and after every release:

1. Open deployed frontend.
2. Register or log in with a demo account.
3. Create or verify at least one account.
4. Add income.
5. Add expense.
6. Create an internal transfer and confirm balances update correctly.
7. Create or verify a budget.
8. Create or verify a savings or emergency goal.
9. Review dashboard totals.
10. Review reports.
11. Export PDF.
12. Export Excel.
13. Open calculator.
14. Review settings.
15. Enable passcode protection if part of the demo path.
16. Confirm locked financial routes require unlock.
17. Log out.
18. Log back in and confirm data persists.
19. Check browser console for production errors.
20. Check backend logs for unexpected errors.

## 9. Demo account/data checklist

Prepare a demo account that uses synthetic data only:

1. Create one cash account.
2. Create one bank-like manual account, clearly not connected to a real bank.
3. Add salary or business income.
4. Add common expenses such as food, transport, rent, utilities, or supplies.
5. Add one internal transfer between accounts.
6. Add one monthly budget.
7. Add one savings goal and one emergency goal.
8. Generate dashboard and report views.
9. Export one PDF and one Excel file.
10. Avoid real names, real bank account numbers, private phone numbers, real invoices, or real customer data.

Demo data should tell a simple story: AccPocket records and explains manually entered financial records, but never moves money.

## 10. Backup and rollback plan

Backup plan:

1. Use Supabase backups or manual database exports before major releases.
2. Keep a known good Git commit or release tag for each demo-ready version.
3. Keep deployment environment variables backed up in the deployment provider's secret store, not in Git.
4. Export demo data before resetting or reseeding a public demo environment.

Rollback plan:

1. If frontend deployment fails, redeploy the previous known good frontend build.
2. If backend deployment fails before migrations, redeploy the previous known good backend.
3. If backend deployment fails after migrations, assess whether migration rollback is safe before changing the database.
4. Restore from Supabase backup only when data recovery is required and the impact is understood.
5. Record the failed release, root cause, and recovery action in release notes.

## 11. Monitoring/logging plan

Minimum monitoring for V1:

1. Backend process uptime.
2. API error logs.
3. Authentication failures and rate-limit events.
4. Database connection failures.
5. Migration/deployment failures.
6. Frontend console errors during smoke tests.
7. Export generation failures.

Logging cautions:

1. Do not log passwords, passcodes, JWTs, refresh tokens, unlock tokens, or full secrets.
2. Avoid logging full financial payloads unless explicitly needed for local debugging.
3. Scrub sensitive values before sharing logs in support or portfolio contexts.

## 12. Security maintenance plan

1. Keep dependencies updated on a planned cadence.
2. Review authentication flows after dependency updates.
3. Rotate secrets after exposure or staff/device changes.
4. Confirm production secrets remain unique and high entropy.
5. Review rate-limit settings after real traffic patterns are known.
6. Keep `.env` files out of Git.
7. Maintain the V1 boundary: no real-money movement or regulated financial service behavior.
8. Document that passcode protection gates app access but does not encrypt database contents.
9. Treat password recovery, OAuth, and MFA as V2 security features, not V1 launch requirements.
10. Review any future AI proposal for explicit privacy, consent, data minimization, retention, and audit design before implementation.

## 13. Dependency update plan

1. Check dependencies monthly or before each portfolio/demo release.
2. Prioritize security updates for Express, Prisma, JWT, bcrypt, Vite, React, and testing libraries.
3. Run install, typecheck, test, and build after dependency updates.
4. Run the production smoke test checklist after deploying dependency updates.
5. Update one risk category at a time when possible.
6. Record update notes, breaking changes, and rollback commit.

Suggested verification commands:

```powershell
pnpm install
pnpm -r typecheck
pnpm -r test
pnpm -r build
```

## 14. Bug triage process

1. Capture the issue title, environment, browser/device, account state, and exact steps to reproduce.
2. Classify severity:
   - P0: data loss, auth bypass, deployed app unavailable, or security exposure.
   - P1: core money-recording workflow broken.
   - P2: reports, exports, dashboard, or important UX degraded.
   - P3: polish, copy, minor visual issue, or non-blocking enhancement.
3. Confirm whether the issue is local-only, production-only, or both.
4. Reproduce with synthetic data.
5. Fix in a branch, verify with focused tests, then run broader release checks when needed.
6. Document the resolution and whether a release is required.

## 15. Release versioning process

Recommended release labels:

1. `v1.0.0-demo-ready` for the first complete V1 demo release.
2. Patch versions for bug fixes, such as `v1.0.1`.
3. Minor versions for non-breaking improvements, such as `v1.1.0`.
4. Major versions for V2 changes, especially AI, account sharing, OAuth/MFA, or large data model changes.

Release checklist:

1. Confirm backlog impact.
2. Run typecheck, tests, and build.
3. Apply Prisma deploy migrations if needed.
4. Deploy backend.
5. Deploy frontend.
6. Run production smoke test.
7. Tag or record the release.
8. Update portfolio/demo notes if user-facing behavior changed.

## 16. Portfolio presentation plan

Position AccPocket V1 as:

1. A mobile-first personal finance and small bookkeeping PWA.
2. A full-stack TypeScript app with React, Vite, Express, Prisma, and PostgreSQL.
3. A manual financial recordkeeping app that never moves real money.
4. A security-aware demo with hardened authentication and passcode-gated access.
5. A practical product with reports, PDF/Excel exports, budgets, savings goals, and dashboard views.

Portfolio talking points:

1. "AccPocket records money; it does not move money."
2. "The app is designed for personal tracking and small bookkeeping, not banking."
3. "AI was intentionally deferred to V2 until privacy and consent rules are designed."
4. "Passcode protection protects app access, but database encryption is a separate future improvement."
5. "The launch plan includes smoke testing, backup, rollback, monitoring, dependency updates, and bug triage."

## 17. Client demo script

Suggested 8 to 10 minute demo:

1. Introduce AccPocket as a finance tracking/bookkeeping app only.
2. State clearly that it does not move real money or connect to real banks.
3. Log in with the demo account.
4. Show dashboard totals.
5. Create or review accounts.
6. Add an income transaction.
7. Add an expense transaction.
8. Create an internal transfer and explain it is only a record inside the app.
9. Show budgets and savings/emergency goals.
10. Open reports and explain the summary.
11. Export PDF and Excel.
12. Show calculator.
13. Show settings and passcode behavior if configured.
14. Close with known V1 boundaries and V2 roadmap.

Do not imply:

1. That AccPocket can transfer money.
2. That it can pay bills.
3. That it can sync with banks.
4. That it gives investment, loan, tax, legal, or financial advice.
5. That AI is included in V1.

## 18. Known limitations of V1

1. Live click-through demo requires production or local `.env` values.
2. Supabase PostgreSQL works through Prisma only when environment values are configured correctly.
3. Normal Windows Node/pnpm may require the `gnode.exe` plus `pnpm.mjs` workaround.
4. Vite may show a non-blocking chunk-size warning.
5. PDF validation has been structural/test-based; visual PDF inspection remains a launch checklist item.
6. Password recovery is not included.
7. OAuth is not included.
8. MFA is not included.
9. AI is not included.
10. Passcode protection gates app access but does not encrypt database contents.
11. There is no bank sync, payment automation, bill payment, loan approval, investment advice, SMS automation, or real-time exchange-rate automation.

## 19. What not to promise to users or clients

Do not promise:

1. Real bank transfers.
2. Bill payment.
3. Payment gateway support.
4. Bank sync.
5. Investment advice.
6. Loan approval.
7. AI financial decision-making.
8. Automatic SMS sending.
9. Real-time exchange-rate automation.
10. Password recovery, OAuth, or MFA in V1.
11. Database field encryption from the passcode.
12. Compliance with banking, lending, investment, tax, legal, or regulated financial advisory requirements.
13. Automatic record creation from AI, SMS, bank feeds, or exchange-rate feeds.

Safe promise:

AccPocket V1 helps users manually record, organize, review, and export their own financial records.

## 20. Maintenance schedule

Weekly:

1. Check production app availability.
2. Review backend errors and auth/rate-limit anomalies.
3. Run a quick smoke test on the live demo account.
4. Confirm backups are present if production data exists.

Monthly:

1. Review dependency updates.
2. Run typecheck, tests, and build.
3. Review security advisories.
4. Refresh demo data if needed.
5. Review the improvement backlog.

Before each release:

1. Confirm scope does not violate V1 boundaries.
2. Run local verification.
3. Apply migrations only if intended and reviewed.
4. Deploy backend and frontend.
5. Run production smoke test.
6. Record release notes and rollback point.

Quarterly:

1. Review roadmap and V2 boundaries.
2. Reassess AI privacy/consent design if AI remains under consideration.
3. Review backup/restore process.
4. Review portfolio presentation and screenshots.

## Step 17 completion assessment

Step 17 can be marked complete when this launch and maintenance plan is accepted as the V1 operating plan and no deployment or feature implementation is requested during Step 17.

Recommended status: complete after owner approval.
