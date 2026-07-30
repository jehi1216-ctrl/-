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

- `projects` — a site/job. `site_area`/`building_area`/`total_floor_area` (`migration_011`, nullable numeric, m²) are entered via `ProjectForm.tsx`; 건폐율/용적률 are **not** stored — `buildingCoverageRatio()`/`floorAreaRatio()` in `src/types/project.ts` derive them from those three fields on every render (`ProjectInfoCard.tsx`), so they're always consistent with whatever area values are currently saved. `phase` (`ProjectPhase` in `src/types/project.ts`): design → permit → construction → supervision → completed (`supervision`/감리 added in `migration_009`; its DB check constraint was dropped and recreated rather than just widened, so re-running `migration_002`'s original constraint definition would break it). `PHASES_BY_TYPE` (same file) groups these into the two top-level tabs: DESIGN = [design, permit], BUILD = [construction, supervision, completed]. `ProjectForm.tsx` has the user pick DESIGN/BUILD first via a toggle, which filters the 공정단계 `<select>` to just that group's phases — this exists specifically to prevent picking a phase that silently lands the project in the wrong top-level tab (happened before the toggle existed).
- `work_logs` — **requires** a `project_id` (NOT NULL FK). There is no "log without a project" concept; `categories` is a text array (not a single value — migrated in `migration_003`, no DB check constraint on values), and `category_details` (jsonb, `migration_004`) carries per-category structured extras (e.g. 협의/PT/브랜딩 categories auto-number a `seq` per project by counting existing rows — see `createLog` in `src/app/(main)/dashboard/actions.ts`). `log_type` (`migration_006`, `'design' | 'build'`, default `'design'`) splits every log into a DESIGN entry (existing taxonomy: 검토/협의/설계/PT/대관/브랜딩, with `category_details`) or a BUILD entry (`BUILD_CATEGORY_OPTIONS` in `src/types/journal.ts`: 건축/인테리어/감리/기타 — simple tags only, no sub-details/numbering; changed from an earlier 공정/검측/협의/안전/품질/기타 set — old logs keep whatever tag text they already have, it just won't be offered as a checkbox anymore). `공사` was removed as a DESIGN category when BUILD was introduced. `TodayEntry.tsx` (dashboard) and `ProjectJournalTabs.tsx` (project detail) both drive project/type selection off `Project.phase` via `PHASES_BY_TYPE`.
- `project_contacts` (협력업체) — per-project child table, full CRUD from `ProjectContacts.tsx` (add/edit-inline/delete via `src/app/(main)/projects/contacts-actions.ts`); editing is an inline form per row (수정 → prefilled inputs → 저장/취소), not a separate page.
- `project_checklist_items` — **managed exclusively from the top-level `/checklist` tab** (`src/app/(main)/checklist/page.tsx` + `ChecklistBoard.tsx`), not from the project detail page (removed from there on purpose — see git history). The tab aggregates every project's items (fetched by `user_id` only, same cross-project pattern as `dashboard/page.tsx`), groups by project, and within each project sub-groups by resolved assignee (`ProjectChecklist`'s `groupByAssignee` prop) — items with no `assignee_contact_id`/`assignee` land in a trailing "담당자 없음" bucket. Completed (`완료`) items are hidden by default behind a single page-level toggle, not per-project. `project_checklist_items.status` (`migration_008`, one of 준비/협의중/진행중/완료, default `준비`) replaced the old `due_date`/`is_done` fields — sort/filtering uses `status !== '완료'`, not `is_done` (column still exists, unused). `assignee` (free text) was likewise superseded by `assignee_contact_id` (`migration_007`, FK to `project_contacts`); `assignee` is kept only as a fallback display for pre-migration rows. `note` (`migration_010`, nullable text) is a free-form per-item comment, edited together with `content`/`assignee_contact_id` via the inline edit form (수정 → prefilled inputs → 저장/취소, same pattern as `ProjectContacts.tsx`) — `updateChecklistItem` in `checklist-actions.ts` handles it; there's no separate "add comment" action. `ProjectChecklist.tsx` is reused in three different contexts (the `/checklist` tab, a compact dashboard view, and journal form) — its `compact`/`title`/`groupByAssignee` props all default to the original flat-list behavior, so changes there ripple to all three; check all call sites before changing its defaults.
- `schedule_items` — per-user, per-date (not per-project) — a flat daily to-do list shown on `/dashboard`, unrelated to `project_checklist_items`.
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

### Working across multiple machines

The local working copy lives inside a Dropbox-synced folder (so `.env.local` and every source file follow you across machines automatically), but **`.git`, `node_modules`, and `.next` are excluded from Dropbox sync** on each machine (via the `com.dropbox.ignored` NTFS extended attribute — `Set-Content -Path '<path>:com.dropbox.ignored' -Value 1`) because Dropbox syncing a live `.git` directory risks corrupting it if two machines write at once, and syncing build/dependency output is both wasteful and prone to file-lock errors mid-build. This exclusion is per-machine, not per-repo — a newly added machine needs it set again. Practical upshot: **git push/pull is the real sync mechanism between machines**, not Dropbox — commit and push before switching machines, and pull before starting work on a different one. `node_modules` must be regenerated per machine with `npm install`.

### Applying new Supabase migrations

Nothing runs migrations automatically — after adding a `supabase/migration_0NN_*.sql` file, it must be pasted into the Supabase dashboard's SQL Editor and run manually before the corresponding app feature will work. Symptom of a missed migration: Server Actions fail with `Could not find the '<column>' column of '<table>' in the schema cache`, often silently if the calling action doesn't surface `error` from the Supabase response (worth checking/fixing when this happens, as it happened with `project_checklist_items` — a failed insert produced no visible feedback).
