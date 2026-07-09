# AccPocket V1

Mobile-first personal finance and small bookkeeping PWA. AccPocket records user-owned accounts, income, expenses, internal transfers, budgets, savings goals, and reports. It never moves real money.

## Workspace

- `apps/web`: React, TypeScript, Vite, Tailwind and PWA client
- `apps/api`: Express, Prisma and PostgreSQL API
- `packages/shared`: API contracts and constants

## Local setup

1. Copy `.env.example` to `.env` and provide PostgreSQL plus secrets.
2. Run `pnpm install`.
3. Run `pnpm db:generate` and `pnpm db:migrate`.
4. Run `pnpm dev`.

Financial APIs require a JWT access token. When passcode protection is enabled they also require the short-lived `X-Unlock-Token`. Refresh tokens are rotated in an HttpOnly cookie.

## AI integration readiness

AccPocket V1 does not include AI features. If AI is added later, it should be treated as an optional V2 assistant layer that explains existing user-owned records without changing them automatically.

Safe V2 candidates:

- Plain-language spending summaries based on already-generated reports.
- Monthly report explanations with clear "not financial advice" wording.
- Budget warning explanations that describe what already happened.
- Expense category suggestions that require explicit user confirmation before saving.
- AI-generated report notes that can be edited, accepted, or discarded by the user.
- Future voice-entry drafts that never create records until the user reviews and confirms every field.

V1 exclusions and safety boundaries:

- No investment, loan, credit, insurance, tax, legal, or financial advice.
- No bank sync, payment automation, exchange prediction, or real-money movement.
- No automatic transaction, account, budget, goal, or report mutation from AI output.
- No external AI API calls or API keys until user consent, data-minimization, retention, and audit rules are designed.
- Do not send sensitive financial data to AI services without explicit opt-in and a visible privacy explanation.
