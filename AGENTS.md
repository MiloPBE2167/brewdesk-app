# AGENTS.md

> Guidance for AI coding agents working in this repo (`brewdesk-app`).
> Project context, principles, decisions, scope locks → [`brewdesk-docs`](https://github.com/MiloPBE2167/brewdesk-docs).

## Read first

Before any non-trivial change, fetch and read:

1. [`brewdesk-docs/CLAUDE.md`](https://github.com/MiloPBE2167/brewdesk-docs/blob/main/CLAUDE.md) — co-builder behavior, principles, scope locks
2. [`brewdesk-docs/docs/05-tech-spec.md`](https://github.com/MiloPBE2167/brewdesk-docs/blob/main/docs/05-tech-spec.md) — stack, schema, RLS rules
3. [`brewdesk-docs/docs/02-current-status.md`](https://github.com/MiloPBE2167/brewdesk-docs/blob/main/docs/02-current-status.md) — active phase + tasks

If the change touches schema, RLS, auth, or anything in scope-lock, also read `03-decisions-log.md`.

## Stack snapshot (canonical: tech-spec.md)

Next.js 16 (App Router + Turbopack) · React 19 · TypeScript strict · Tailwind v4 · pnpm (corepack) · Node ≥20.9 · Supabase (`@supabase/ssr`) · shadcn/ui + lucide-react · Mapbox GL JS

If anything in this line conflicts with `05-tech-spec.md`, the docs repo wins.

## Code patterns

### Required

- **App Router only.** `app/` directory, Server Components by default, `'use client'` opt-in per file.
- **Mutations via Server Actions**, not `pages/api/`. Route handlers (`app/api/*/route.ts`) only for webhooks or third-party callbacks (e.g. Supabase auth callback).
- **Navigation:** `next/navigation` (`useRouter`, `redirect`, `notFound`). Never `next/router`.
- **Supabase clients:** factories in `lib/supabase/{client,server,middleware}.ts`. One context per file, do not mix.
- **RLS-first.** Client and server code use anon key; RLS enforces access. Service role only in `scripts/` (admin/seed), never imported from `app/` or `components/`.
- **Types from DB:** regenerate `lib/supabase/types.ts` after every migration via `supabase gen types typescript`. Commit the regenerated file.
- **Env vars:** `NEXT_PUBLIC_*` for client-exposed, plain `process.env.*` for server-only. Document new vars in `.env.example`.
- **Tailwind v4 syntax:** `@import "tailwindcss"` in `app/globals.css`, theme via `@theme` directive, no `tailwind.config.ts` content array.

### Forbidden

- ❌ `getServerSideProps`, `getStaticProps`, `getInitialProps` (Pages Router primitives)
- ❌ `any` without a `// reason:` comment on the same line
- ❌ Client-side fetch for initial render data (use Server Components + Server Actions)
- ❌ Hardcoded URLs, keys, secrets, café data
- ❌ Bypassing RLS from client code under any framing
- ❌ Adding a dependency without checking bundle impact and noting it in the PR/commit message

## Folder layout

~~~
app/
  (auth)/login/              # public auth routes
  (auth)/auth/callback/
  (app)/dashboard/           # protected, post-login
  (app)/cafes/
  (app)/checkin/
  layout.tsx
  globals.css
components/
  ui/                        # shadcn primitives — regenerate via CLI, don't hand-edit
  feature/                   # business components, grouped by feature folder
lib/
  supabase/
    client.ts                # browser client
    server.ts                # server client (RSC, server actions, route handlers)
    middleware.ts            # session refresh middleware
    types.ts                 # generated DB types
  utils.ts                   # cn(), formatters
supabase/
  migrations/                # YYYYMMDDHHMMSS_name.sql
scripts/                     # admin/seed scripts using service role
~~~

## Scope locks (do not implement without unlock)

Authoritative list: [`brewdesk-docs/CLAUDE.md §6`](https://github.com/MiloPBE2167/brewdesk-docs/blob/main/CLAUDE.md). Quick reference of what to refuse:

- DM 1-1 between users (only spot-bound chat, Beta v2)
- Google Places API / Google rating / `google_place_id` column
- pgvector / vector search
- QR check-in
- Premium tier, ads, paywall
- Mini-note, focus room, structured verify

If asked, point to the docs repo and stop. Do not "draft a quick version" or "scaffold the table just in case."

## Workflow expectations

- Before adding a table/column/index: check `05-tech-spec.md` schema section. Diff justified by a `03-decisions-log.md` entry.
- Before adding a dependency: justify in commit message (what it solves, bundle size, why not stdlib/existing dep).
- Before refactoring across folders: confirm scope with human, don't auto-expand.
- After schema change: regenerate types, run `pnpm typecheck`, update relevant doc in `brewdesk-docs`.

## Commands

~~~bash
pnpm dev              # Turbopack dev server, localhost:3000
pnpm build            # production build
pnpm start            # serve production build
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
~~~

## When confused

Ask in chat instead of guessing. The cost of asking is one message; the cost of writing the wrong thing into the schema or RLS is a migration + decision-log retraction.
