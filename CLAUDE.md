# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (Turbopack) at http://localhost:3000
npm run build     # production build
npm run start     # run production build locally
npm run lint      # eslint .
npx tsc --noEmit  # type-check (there is no separate "typecheck" script)
```

There is no test suite/framework configured in this repo.

Environment variables live in `.env.local` (see `.env.local.example` for the full list and where to obtain each value). Next.js auto-reloads `.env.local` changes into an already-running `npm run dev` process (look for `Reload env: .env.local` in the dev server log) — no restart needed.

## Architecture

Next.js 16 App Router + React 19 + TypeScript + Tailwind, no ORM and no client-state library. Data access goes straight through the Supabase JS client (PostgREST), and mutations are Server Actions (`"use server"` files named `actions.ts` / `*-actions.ts` next to the routes that use them), not API routes.

### Domain model

What started as a simple daily work log (`work_logs`) has grown into a per-project ("현장"/site) tracking system. Key tables (see `supabase/schema.sql` + `supabase/migration_00*.sql` for the incremental history, and `src/types/*.ts` for the corresponding TS shapes):

- `projects` — a site/job (`phase`: design → permit → construction → completed).
- `work_logs` — **requires** a `project_id` (NOT NULL FK). There is no "log without a project" concept; `categories` is a text array (not a single value — migrated in `migration_003`), and `category_details` (jsonb, `migration_004`) carries per-category structured extras (e.g. 협의/PT/공사/브랜딩 categories auto-number a `seq` per project by counting existing rows — see `createLog` in `src/app/(main)/dashboard/actions.ts`).
- `project_contacts`, `project_checklist_items`, `schedule_items` — straightforward per-project child tables.
- `project_files` — attachment metadata; `file_path` is an opaque string whose meaning depends on the storage backend (see below).

Every table has RLS scoped to `auth.uid() = user_id`; the app relies entirely on RLS for authorization (no `service_role` key is used anywhere).

The category taxonomy (`CATEGORY_OPTIONS` and each category's sub-options) is hardcoded in `src/types/journal.ts`, not data-driven — a "custom categories" feature would need this moved into a table.

### Auth

Supabase Auth (email/password) via `@supabase/ssr`. Session refresh + route protection happens in `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; don't be surprised it's not where you'd expect), which delegates to `updateSession()` in `src/lib/supabase/middleware.ts`. `(main)/layout.tsx` does a second, redundant server-side `getUser()` check. Public paths are hardcoded (`/login`, `/signup`, `/auth/callback`).

### File attachments: Dropbox, not Supabase Storage

Attachments (`project_files`) are stored in **Dropbox** via direct HTTP calls to the Dropbox API (`src/lib/dropbox/client.ts` — no SDK dependency, just `fetch`), proxied through Server Actions in `src/app/(main)/projects/files-actions.ts`. This replaced an earlier Supabase Storage implementation to work around Supabase's free storage tier; `project_files.file_path` now holds a Dropbox path (`/{user_id}/{project_id}/{timestamp}_{filename}`) instead of a Supabase Storage key. `ProjectFiles.tsx` calls these server actions instead of talking to Supabase Storage directly, because the Dropbox app secret must stay server-side.

Two non-obvious constraints in `src/lib/dropbox/client.ts` that broke this in production before:
- The `Dropbox-API-Arg` header is ASCII-only (fetch throws `ByteString` errors on raw non-ASCII bytes), so any non-ASCII filename (e.g. Korean) must be `\uXXXX`-escaped before being put in that header — see `encodeApiArg()`. This restriction only applies to the `files/upload` header; the JSON *bodies* used by `get_temporary_link`/`delete_v2` don't have this problem.
- The Dropbox refresh token is scoped to whatever permissions (`files.content.write`/`.read`) were enabled **at the time it was issued**. Enabling a new scope in the Dropbox App Console does not retroactively apply to an already-issued refresh token — it must be re-issued (redo the OAuth authorize → code exchange flow) after changing scopes.
- Access tokens are short-lived and cached in-module (`cachedToken` in `client.ts`); this cache does not survive across serverless invocations on Vercel, so every cold start re-exchanges the refresh token.

Server Actions default to a 1MB body limit, which photo uploads exceed; `next.config.mjs` raises this via `experimental.serverActions.bodySizeLimit`.

### Deployment

Deployed on Vercel via the GitHub integration (push to `master` auto-deploys) — there is no `vercel.json`. The Vercel project name is **`-`** (a bare hyphen, matching the GitHub repo name `jehi1216-ctrl/-`), aliased to `one-chi-60.vercel.app`; it is *not* named after the repo's local folder name (`work-journal`). Running `vercel link` fresh in this directory without `--project -` will create a new, wrong project instead of linking the existing one.

Env vars must be set in Vercel for all three of Production/Preview/Development (`vercel env add <NAME> <env>`) for `vercel dev`/preview deployments to work, in addition to `.env.local` for local dev. When scripting `vercel env add` non-interactively on Windows, avoid piping values through a PowerShell string pipe (`"value" | npx vercel ...`) — PowerShell's pipeline encoding can inject stray characters (this silently corrupted the Dropbox credentials once, causing `invalid_client` errors). Redirect from a file written without a BOM instead (e.g. `cmd /c "npx vercel env add NAME production < file.txt"`).
