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
