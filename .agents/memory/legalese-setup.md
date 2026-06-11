---
name: Legalese project setup
description: Non-obvious constraints and decisions for the Legalese contract review app
---

## Clerk proxy pattern
`publishableKeyFromHost` imported from `@clerk/react/internal`. `proxyUrl` set unconditionally via `VITE_CLERK_PROXY_URL`. Routes `/sign-in/*?` and `/sign-up/*?` required verbatim.

**Why:** The Replit Clerk integration uses a proxy; standard `publishableKey` prop won't work.

## pdf-parse ESM workaround
```ts
const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse") as (...) => Promise<...>;
```
**Why:** pdf-parse has no ESM default export; a plain `import pdfParse from "pdf-parse"` fails at runtime in the esbuild CJS bundle.

## Tailwind v4 + Clerk CSS
`index.css` uses `@import "tailwindcss"`. Vite config needs `tailwindcss({ optimize: false })` to prevent Clerk CSS conflicts.
**Why:** Tailwind v4's optimizer can strip Clerk component styles.

## Route ordering in contracts.ts
Static routes (`/stats`, `/expiring`, `/templates`, `/upload`, `/send-expiry-alerts`) MUST be registered before `/:id`.
**Why:** Express matches routes in order; a param route would swallow static segment names.

## api-zod export conflict
`lib/api-zod/src/index.ts` exports `export * from "./generated/api"` then `export * from "./generated/types"` then an explicit named re-export `export { UploadContractFileBody } from "./generated/api"` to resolve a naming conflict between the two generated files.

## ContractDetail vs Contract types
`Contract` (list item) has `versionCount`, `commentCount`, `riskCount`. `ContractDetail` (single item) does NOT. Don't reference count fields in the contract-view page.

## After codegen
Always run `pnpm run typecheck:libs` after `pnpm --filter @workspace/api-spec run codegen` to rebuild lib declarations before checking leaf packages.
