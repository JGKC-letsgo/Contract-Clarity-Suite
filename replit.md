# Legalese

AI-powered contract review app that flags risky clauses, summarises key terms, tracks versions, and helps teams negotiate with confidence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — Express session secret
- Optional env: `RESEND_API_KEY` — Resend API key for email expiry alerts
- Clerk keys are provisioned automatically via the Replit Clerk integration (app_3EypQIfbcpwWxQLjggV8lDQIgr6)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth (`@clerk/express`)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + wouter + TanStack Query
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)
- Email: Resend (via `RESEND_API_KEY`)
- File parsing: `pdf-parse` + `mammoth` (PDF/DOCX upload)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema.ts` — Drizzle schema (source of truth for DB shape)
- `lib/api-client-react/src/generated/` — generated TanStack Query hooks (do not edit manually)
- `lib/api-zod/src/generated/` — generated Zod validation schemas (do not edit manually)
- `artifacts/api-server/src/routes/contracts.ts` — all contract-related API routes
- `artifacts/contract-review/src/` — React frontend (pages, components, layout)
- `artifacts/contract-review/src/index.css` — Tailwind v4 theme + Clerk layer ordering

## Architecture decisions

- **Contract-first API**: OpenAPI spec in `lib/api-spec/` drives generated hooks + Zod schemas. Always edit the spec first, then run codegen.
- **Clerk auth via proxy**: Frontend uses `publishableKeyFromHost` + `proxyUrl` pattern; API uses `@clerk/express` `clerkMiddleware` + `getAuth`. The proxy URL is set via `VITE_CLERK_PROXY_URL`.
- **pdf-parse ESM workaround**: `pdf-parse` has no ESM default export; imported via `createRequire(import.meta.url)` in the API server.
- **Route ordering critical**: In `contracts.ts`, static routes (`/stats`, `/expiring`, `/templates`, `/upload`, `/send-expiry-alerts`) must be registered BEFORE the `/:id` param route to avoid mis-matching.
- **Tailwind v4 + Clerk**: `index.css` must import Tailwind via `@import "tailwindcss"` and Clerk's `@clerk/react` styles must come after (layer ordering). Vite config uses `tailwindcss({ optimize: false })` to avoid Clerk CSS conflicts.

## Product

- **Dashboard** — overview stats, contract list with search/filter, expiry alert email button
- **Contract view** — full contract text with AI risk highlights, negotiation tracking, comment threads, version history with side-by-side diff, shareable read-only links
- **New contract** — paste text or upload PDF/DOCX/TXT; populate from built-in templates (NDA, MSA, SLA, Employment Agreement)
- **Email alerts** — send a formatted HTML email of soon-to-expire contracts via Resend
- **Auth** — Clerk sign-up / sign-in; all write operations require authentication

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs` before checking leaf packages.
- `pnpm run typecheck:libs` must be run after codegen to rebuild generated lib declarations used by artifact packages.
- Do NOT run `pnpm dev` at workspace root — use the Replit workflows or `restart_workflow`.
- `pdf-parse` must be imported via `createRequire` (see Architecture decisions above); a plain ESM `import` will fail at runtime.
- Clerk's `publishableKeyFromHost` is imported from `@clerk/react/internal` — not a public API but required for the proxy pattern.
- Email alerts use `from: "Legalese <alerts@legalese.app>"` — the Resend account must have this domain verified, or change to a verified sender.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk proxy / publishable key pattern details
