# AccPocket Phoenix 17 Step 16 Improvement Backlog

AccPocket V1 is a personal finance and small bookkeeping PWA that records user-owned financial data only. It does not move real money, connect to banks, pay bills, approve loans, provide investment advice, or make automated financial decisions.

This backlog is for planning and launch readiness. It does not authorize implementation of any item.

## 1. Must-fix before launch

1. Configure production `.env` values for the live demo and production deployment.
   - Priority: P0
   - Rationale: The live click-through demo cannot be validated end to end without valid PostgreSQL and secret configuration.
   - Scope: Environment configuration only; no app feature changes.

2. Verify the deployed API, web app, and Supabase PostgreSQL connection together.
   - Priority: P0
   - Rationale: Local code/test/build checks passed, but launch readiness requires the deployed stack to prove real connectivity.
   - Scope: Smoke test authentication, account creation, transaction entry, internal transfers, budgets, goals, reports, exports, settings, and logout.

3. Confirm production secret strength and separation.
   - Priority: P0
   - Rationale: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_UNLOCK_SECRET` must be unique, high-entropy, and not copied from examples.
   - Scope: Deployment checklist and environment review.

4. Document the Windows runtime workaround for local maintainers.
   - Priority: P1
   - Rationale: Normal Windows Node/pnpm may require the bundled `gnode.exe` plus `pnpm.mjs` workaround in this workspace.
   - Scope: Documentation only.

5. Run one final launch smoke test after environment setup.
   - Priority: P0
   - Rationale: Step 15 passed code/test/build checks, but Step 17 needs a final configured live demo pass.
   - Scope: Manual validation and notes.

## 2. Should-fix before launch

1. Add a concise launch checklist to the README or docs.
   - Priority: P1
   - Rationale: Keeps setup, migration, deployment, and demo verification repeatable.

2. Review the Vite chunk-size warning.
   - Priority: P2
   - Rationale: It is non-blocking, but should be acknowledged before launch so it is not mistaken for a release failure.
   - Expected outcome: Decide whether to defer, split chunks, or document as acceptable for V1.

3. Perform visual inspection of generated PDF exports.
   - Priority: P1
   - Rationale: Current PDF inspection was structural/test-based, not visual.
   - Expected outcome: Confirm readable layout, totals, table spacing, page breaks, and branding.

4. Confirm demo seed data or demo walkthrough script.
   - Priority: P1
   - Rationale: A portfolio/demo app benefits from a predictable story with accounts, income, expenses, transfers, goals, and reports.

5. Check mobile install/PWA behavior on at least one mobile-width viewport.
   - Priority: P2
   - Rationale: AccPocket is mobile-first, so the launch demo should show acceptable responsive behavior.

## 3. Nice-to-have after launch

1. Add sample screenshots to the README.
2. Add a short demo video or GIF for portfolio presentation.
3. Add richer empty states for first-time users.
4. Add optional sample data reset for demos.
5. Add CSV import for manual transaction entry, with review before save.
6. Add more export templates for monthly or yearly summaries.
7. Add user-selectable report date presets.
8. Add optional account icons or colors.
9. Add guided onboarding for first account, first transaction, and first budget.
10. Add help text for accounting terms used in reports.

## 4. V2 feature ideas

1. Password recovery flow.
2. OAuth sign-in.
3. Multi-factor authentication.
4. Household or small-team shared ledgers with permissions.
5. Recurring transaction templates that create drafts for user approval.
6. Advanced category rules that suggest, but do not automatically mutate, records.
7. Attachment support for receipts and invoices.
8. More advanced budget forecasting based only on user-entered data.
9. Multi-currency manual records using user-entered rates.
10. Optional offline-first improvements with conflict handling.
11. Audit history for user-visible record changes.
12. More robust import/export workflows.

## 5. AI V2 ideas

1. Plain-language spending summaries based on existing reports.
2. Monthly report explanations with clear "not financial advice" wording.
3. Budget warning explanations that describe what already happened.
4. Expense category suggestions requiring explicit user confirmation before saving.
5. AI-generated report notes that users can edit, accept, or discard.
6. Voice-entry drafts that never create records until the user reviews and confirms every field.
7. Natural-language search over existing user-owned records.
8. Anomaly explanations that flag unusual spending patterns without making decisions.
9. Demo-only AI assistant mode using synthetic/sample data.
10. AI privacy controls covering opt-in, data minimization, retention, and auditability.

AI V2 guardrails:

1. No investment, loan, credit, insurance, tax, legal, or financial advice.
2. No automatic transaction, account, budget, goal, or report mutation from AI output.
3. No external AI API calls or API keys until consent and privacy rules are designed.
4. No sensitive financial data sent to AI services without explicit opt-in and visible privacy explanation.

## 6. Security improvements

1. Add password recovery, OAuth, and MFA in V2, not V1.
2. Consider optional at-rest encryption strategy for sensitive fields.
3. Document clearly that passcode protection gates app access but does not encrypt database contents.
4. Add security headers review for deployed environments.
5. Add refresh-token/session management UI for active sessions.
6. Add audit logging for authentication-sensitive events.
7. Add dependency scanning in CI.
8. Add production rate-limit tuning after real deployment behavior is observed.
9. Add stricter environment validation for production startup.
10. Create a security disclosure/contact note for portfolio use.

## 7. Performance improvements

1. Investigate Vite chunk-size warning and code-splitting options.
2. Add bundle analysis for the web app.
3. Review report and export generation performance with larger datasets.
4. Add pagination or virtualized tables if transaction history grows large.
5. Cache dashboard/report queries where safe.
6. Add database indexes based on real query patterns.
7. Measure PWA load time on mobile networks.
8. Review chart rendering performance on low-end mobile devices.

## 8. UX/design improvements

1. Improve first-run onboarding.
2. Add a guided demo mode with sample financial records.
3. Improve error states for API connection and expired sessions.
4. Make export actions more discoverable.
5. Add clearer labels explaining internal transfers versus expenses.
6. Improve visual hierarchy on dense reports.
7. Add mobile polish for forms with many numeric fields.
8. Add confirmation previews for destructive or high-impact record changes.
9. Add optional compact mode for frequent users.
10. Add accessibility pass for focus states, labels, contrast, and keyboard flows.

## 9. Testing improvements

1. Add live deployment smoke-test checklist.
2. Add visual PDF regression checks or stored render snapshots.
3. Add browser-based end-to-end tests for critical flows.
4. Add mobile viewport tests for core pages.
5. Add PWA install/offline behavior checks.
6. Add tests for production environment validation failures.
7. Add larger dataset tests for reports, exports, and dashboard totals.
8. Add accessibility tests for core flows.
9. Add regression tests for refresh-token rotation and unlock-token behavior.
10. Add backup/restore or migration rehearsal notes for PostgreSQL.

## 10. Deployment/DevOps improvements

1. Document production environment setup.
2. Document Supabase connection and Prisma migration sequence.
3. Add CI checks for install, typecheck, test, and build.
4. Add dependency/security scanning.
5. Add deployment smoke-test checklist.
6. Add rollback notes for failed deployments.
7. Add database backup guidance.
8. Add environment-specific CORS and origin checklist.
9. Add release notes template.
10. Add monitoring/logging recommendations for API errors and auth failures.

## 11. Business/portfolio improvements

1. Add a portfolio case-study section explaining the problem, architecture, security posture, and limitations.
2. Add demo screenshots and a walkthrough script.
3. Add a clear "records money only; does not move money" statement in demo materials.
4. Add a V1 versus V2 roadmap summary.
5. Add a technical architecture diagram.
6. Add a short privacy and data-handling explanation for demo viewers.
7. Add recruiter/client-friendly feature list.
8. Add known limitations section to set expectations honestly.
9. Add deployment links once the live demo is configured.
10. Add changelog entries for Phoenix milestones.

## 12. Features explicitly not allowed in V1

These items must remain out of V1:

1. Real bank transfers.
2. Bill payment.
3. Payment gateway integration.
4. Bank sync.
5. Investment advice.
6. Loan approval.
7. AI financial decision-making.
8. Automatic SMS sending.
9. Real-time exchange-rate automation.
10. Automatic AI-created or AI-mutated financial records.
11. External AI API calls involving sensitive financial data.
12. Password recovery, OAuth, and MFA.
13. Any feature that moves real money or implies regulated financial service behavior.

## Step 16 completion assessment

Step 16 can be marked complete when this backlog is accepted as the V1 improvement backlog and no implementation is requested during Step 16.

Recommended status: complete after owner approval.
