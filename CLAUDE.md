# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The app is called **ArchiLog** (한글 보조 표기 "나의 건축일지") in the UI — header wordmark, login/signup screens, `layout.tsx` metadata. That rename is **UI-only and deliberate**: the npm package name, the local folder (`work-journal`), the GitHub repo (`-`) and the Vercel project (`-`) all still use the old names, so don't "fix" them for consistency.

Vocabulary drifted mid-project: a job used to be 현장 everywhere, and the nav tab + `/projects` heading are now 프로젝트. Other screens still say 현장 (checklist picker, the 현장 없음 option on 일정). That is not yet unified — ask before doing a sweep.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (Turbopack) at http://localhost:3000
npm run build     # production build
npm run lint      # eslint .
npx tsc --noEmit  # type-check (there is no separate "typecheck" script)
```

There is no test suite/framework configured. Verification = `tsc --noEmit` + `lint` + `build`.

Environment variables live in `.env.local` (see `.env.local.example`). Next.js auto-reloads `.env.local` into a running dev server — no restart needed.

## Architecture

Next.js 16 App Router + React 19 + TypeScript + Tailwind. No ORM, no client-state library. Data access goes straight through the Supabase JS client (PostgREST); mutations are Server Actions (`actions.ts` / `*-actions.ts` next to the routes that use them), not API routes.

Every table has RLS scoped to `auth.uid() = user_id`, and the app relies entirely on RLS for authorization — no `service_role` key anywhere. Queries therefore filter by `user_id` only and let RLS do the rest.

### Domain model

See `supabase/schema.sql` + `supabase/migration_0NN_*.sql` for history, `src/types/*.ts` for the TS shapes.

**`projects`** — a site/job.
- `phase`: design → permit → construction → supervision → completed. `PHASES_BY_TYPE` (`src/types/project.ts`) groups these into the two top-level tabs used app-wide: DESIGN = [design, permit], BUILD = [construction, supervision, completed].
- `ProjectForm.tsx` makes you pick DESIGN/BUILD first, which filters the 공정단계 `<select>`. This exists to stop a phase choice that silently files the project under the wrong tab.
- `site_area`/`building_area`/`total_floor_area` (m², nullable). 건폐율/용적률 are **never stored** — `buildingCoverageRatio()`/`floorAreaRatio()` derive them on every render, so they can't go stale.
- `supervision` (감리) was added later by dropping and recreating the phase check constraint; re-running `migration_002`'s original constraint would break it.

**`work_logs`** — requires a `project_id` (NOT NULL). There is no "log without a project".
- `categories` is a text array (no DB check constraint); `category_details` (jsonb) carries per-category extras — 협의/PT/브랜딩 auto-number a `seq` per project by counting existing rows (`createLog`).
- `log_type` splits every log into DESIGN (검토/협의/설계/PT/대관/브랜딩, with `category_details`) or BUILD (`BUILD_CATEGORY_OPTIONS`: 건축/인테리어/감리/기타 — plain tags, no numbering). Old logs keep tag text that is no longer offered as a checkbox.
- Entry flow is fixed: 프로젝트 → 기록(`content`) → 결과(`result`, optional) → 상태(`status`).
- **`status` is not a progress flag — it records what happens next:** `todo` (내가 할 일, text in `next_action`, optional `next_action_date`), `waiting` (답변 대기), `done` (종료, 결정사항 in `decision`).
- `next_action`/`next_action_date` are written only when `status === 'todo'`, `decision` only when `status === 'done'`; `createLog`/`updateLog` null the others out. But `updateLogStatus` (the badge that cycles todo → waiting → done) deliberately **does not** clear them, so one stray click can't destroy typed text and cycling back restores it. Every reader gates on status, so a stale value is never displayed.
- Closing does **not** go through `updateLogStatus`: the 종료 button opens `CloseLogPrompt.tsx` (shared by `JournalEntryCard`, `OpenLogsSection`, `CalendarDayPanel`) and calls `closeLog(id, decision)`. Its empty-decision case ("그냥 종료") omits the column from the update rather than writing null, so an earlier 결정사항 survives.
- `StatusFieldset.tsx` (radios + conditional 할 일/결정사항 inputs) is shared by `JournalForm` and `EditLogForm`. The radios are React-controlled, so `JournalForm` remounts it via `key={state.submittedAt}` to reset after a save — `form.reset()` alone won't do it.
- A log's 할 일 is deliberately **not** wired to `project_checklist_items`. It stays in the log.

**`project_contacts`** (협력업체) — per-project, full CRUD from `ProjectContacts.tsx`; editing is an inline form per row (수정 → prefilled inputs → 저장/취소).

**`project_checklist_groups`** + **`project_checklist_items`** — folders and the items filed into them.
- Folders came from one project accumulating a long flat list that was really "설계변경 보완사항". `items.group_id` is a **nullable** FK with `on delete set null`: every pre-existing item sits in the `NO_GROUP_LABEL` ("폴더 없음") bucket, and deleting a folder unfiles its items instead of destroying them.
- `status` (준비/협의중/진행중/완료) replaced `due_date`/`is_done` — filtering uses `status !== '완료'`; the `is_done` column still exists, unused.
- `assignee_contact_id` (FK to `project_contacts`) superseded the free-text `assignee`, but `assignee` is still load-bearing: it stores the **"나"** option (`ME_ASSIGNEE`), since the user is not one of their own 협력업체 rows and this needed no new column. The dropdown's `me` value (`ME_OPTION_VALUE`) is a UI sentinel, never stored. The edit form posts a `prev_assignee` hidden field so switching *away* from 나 clears it while leaving any other legacy name alone — that text isn't shown in the form, so overwriting it would destroy data the user can't see.
- `note` is a free-form per-item comment edited together with content/assignee; there is no separate "add comment" action.
- `ProjectChecklist.tsx` is reused in three contexts (checklist tab, compact journal form, and any future compact view). Its `compact`/`title`/`groupByAssignee`/`groups`/`groupId` props all default to the original flat-list behavior — check every call site before changing a default.

**`schedule_items`** — per-user, per-date 일정, with an **optional** `project_id` (`on delete set null`, so deleting a site keeps the 일정 and just unlinks it). Unrelated to `project_checklist_items`.

**`project_files`** — attachment metadata; `file_path` is an opaque string whose meaning depends on the storage backend (see below).

The category taxonomy (`CATEGORY_OPTIONS` and sub-options) is hardcoded in `src/types/journal.ts`. A "custom categories" feature would need it moved into a table.

### Screens

Drill-down screens keep their state in **search params, not React state**, so back/forward and link sharing work: `/checklist?project=&group=`, `/calendar?month=`, `/weekly?week=`. Unknown ids fall back to the parent screen rather than erroring.

**`/dashboard` (오늘 기록)** — 일정 + today's entry form + today's logs. `TodayEntry` owns the entry date: it defaults to `todayKST()`, and a 지난날 기록하기 toggle swaps in `<input type="date" max={today}>` whose value becomes `JournalForm`'s `date` prop. That prop is only ever a hidden field, so changing it must **not** remount the form — a `key={date}` there would wipe what the user already typed. Backdating needs no schema support; it just writes a different `work_logs.date`.

`TodayEntry` has its **own local copy** of `PHASES_BY_TYPE` that is missing `supervision`, so 감리 projects don't appear in its BUILD tab. Known, left alone on request.

**`/weekly` (주간 업무)** — read-only planning view merging three sources: `todo` logs, `waiting` logs, and undone `schedule_items`, grouped **by project** into four buckets (`밀린 것` / `이번 주` / `답변 대기` / `날짜 없음`). The undated buckets are the point of the screen — an undated `next_action` and a 답변 대기 log appear nowhere on `/calendar`. **Three of the four buckets are current-week-only** (`밀린 것`, `답변 대기`, `날짜 없음`): they have no date placing them in any week, so showing them everywhere would repeat the same pile forever. Weeks run Monday–Sunday, identified by their Monday; a mid-week `?week=` value is snapped back. `schedule_items` may have a null `project_id`, so the grouping key is `""` for a trailing 프로젝트 없는 일정 group with grey styling (`projectColorClass()` needs a real id). 답변 대기 rows show `result` in a violet box because "where does this stand" is the whole question for them.

**`/journal` (전체 목록)** — filterable log list, with `OpenLogsSection.tsx` (미처리 모아보기) on top. It derives its list from the `allLogs` the page already fetched, so **it narrows with the active filters** at no extra round-trip. It was briefly on `/dashboard` too and was removed — the dashboard is for today's entry and the roll-up duplicated the list right below it. It writes only through `updateLogStatus`/`closeLog` plus the shared `EditLogForm`, so it needs no action of its own, and renders nothing when there are no open logs.

**`/calendar`** — `schedule_items` plus `todo` logs with a `next_action_date`, merged into one `CalendarEntry` union (`src/types/calendar.ts` — kept out of both components so the two client files and the server page can import it without a cycle). `CalendarGrid.tsx` is a client component whose cells are buttons; clicking one expands that day in full via `CalendarDayPanel.tsx`, since cell chips truncate. The panel is also where items are **edited**, each through a narrow action rather than the full form: `updateNextAction` (할 일 text + date — clearing the date drops it off the calendar but keeps it in `/weekly`), `updateLogStatus`/`closeLog`, and the `schedule_items` CRUD. `CalendarGrid` remounts the panel with `key={selected}` so per-row edit state doesn't leak between days. Only 일정 can be *created* here — a 할 일 only exists as part of a log.

**`/checklist`** — three drill-downs: project card grid (split DESIGN/BUILD, with remaining/done and per-status counts) → that project's folder cards (+ a 폴더 없음 card when unfiled items exist) → one folder's items via `ChecklistBoard.tsx`. `group=none` selects the unfiled bucket. Two load-bearing details: a project with **no** folders skips the folder screen entirely and goes straight to the flat list (so nothing changed for projects that never adopted folders), and *because of that skip* the 폴더 추가 form must also render on the flat list — otherwise it is unreachable and no first folder could ever be created. Items are fetched for all projects on every screen (the grids need counts); only `project_contacts` is narrowed. Inside a folder, items sub-group by resolved assignee with 나 first and 담당자 없음 last. The add-form carries a hidden `group_id` so items land in the folder they were typed into; the *edit* form's folder `<select>` (rendered only when folders exist) is how an item moves.

Checklist items are managed **exclusively** from this tab, not the project detail page (removed there on purpose).

**`/projects`** — DESIGN/BUILD tabs of project cards. Each card summarises both kinds of open work: unfinished logs as `내가 할 일 N` / `답변 대기 N` chips (counted server-side via `select("project_id, status")` — the rows are never needed), and the open checklist as **one line per folder** rather than listing items. The page already filters to `status != '완료'`, so those counts are always "remaining", and an empty folder simply doesn't appear. An item whose `group_id` no longer matches a live folder counts as ungrouped rather than being dropped.

### Colour conventions

Three palettes, all defined as **complete class strings** because Tailwind cannot see dynamically built names:

- **Project colour** — `projectColorClass()` / `projectBarClass()` (`src/lib/projectColor.ts`) hash the project id into one fixed 10-colour palette. Derived, not stored, so the same site is the same colour on every screen with no migration. **Reordering that palette silently recolours every existing project.** The accent values are `border-l-*` (left side only), not `border-*`: paired with a `border border-gray-100` box, a plain `border-*` would fight the grey on all four sides and the winner depends on Tailwind's emit order.
- **Log status** — `STATUS_BADGE_CLASS` (`src/types/journal.ts`): 내가 할 일 amber / 답변 대기 violet / 종료 emerald, each with a ring so status badges read apart from the flat category badges. Reused by `StatusFieldset` so form and card agree.
- **Checklist status** — `CHECKLIST_STATUS_BADGE_CLASS` (`src/types/project.ts`). These strings are applied to a `<select>`, so **keep the text colour dark** — white text makes the expanded option list invisible in some browsers.
- **Urgency** — `dueBadge()` (`src/lib/date.ts`) produces 지남/오늘/D-N labels + colours; it lives there so `/journal` and `/weekly` can't drift apart.

> **`tailwind.config.ts`'s `content` is a single `./src/**/*.{ts,tsx}` glob on purpose.** It used to list `app`/`components`/`lib` folder by folder, which silently purged every colour constant living in `src/types/*.ts`: the class names were in the markup but no CSS rule was ever generated, so badges rendered unstyled and edits to those constants appeared to do nothing at all. Don't narrow it back.

Date helpers all live in `src/lib/date.ts` and are `Date.UTC`-based to avoid timezone drift: `todayKST`, `diffDays`, `formatDateLabel`/`formatShortDate`/`weekdayOf`, month helpers (`currentMonthKST`/`shiftMonth`/`buildMonthGrid`) and week helpers (`weekStartOf`/`currentWeekKST`/`shiftWeek`/`weekEndOf`/`formatWeekRange`).

### Auth

Supabase Auth (email/password) via `@supabase/ssr`. Session refresh + route protection happen in `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts` — it is not where you'd expect), delegating to `updateSession()` in `src/lib/supabase/middleware.ts`. `(main)/layout.tsx` does a second, redundant `getUser()` check. Public paths are hardcoded (`/login`, `/signup`, `/auth/callback`).

### File attachments: Dropbox, not Supabase Storage

Attachments are stored in **Dropbox** via direct `fetch` calls (`src/lib/dropbox/client.ts`, no SDK), proxied through Server Actions in `files-actions.ts` because the app secret must stay server-side. This replaced Supabase Storage to work around the free tier; `project_files.file_path` holds a Dropbox path (`/{user_id}/{project_id}/{timestamp}_{filename}`).

Three things that broke this in production before:
- The `Dropbox-API-Arg` header is ASCII-only (fetch throws `ByteString` errors), so non-ASCII filenames must be `\uXXXX`-escaped — see `encodeApiArg()`. Only the `files/upload` header is affected; the JSON *bodies* used by `get_temporary_link`/`delete_v2` are fine.
- The refresh token is scoped to the permissions enabled **when it was issued**. Enabling a new scope in the App Console does not apply retroactively — the token must be re-issued via the full OAuth flow.
- Access tokens are cached in-module, which doesn't survive serverless cold starts on Vercel, so every cold start re-exchanges the refresh token.

Server Actions default to a 1MB body limit, which photo uploads exceed; `next.config.mjs` raises it via `experimental.serverActions.bodySizeLimit`.

### Deployment

Vercel via the GitHub integration — **push to `master` auto-deploys**. There is no `vercel.json`. The Vercel project is named **`-`** (a bare hyphen, matching the GitHub repo `jehi1216-ctrl/-`), aliased to `one-chi-60.vercel.app` — *not* named after the local folder. `vercel link` without `--project -` will create a new, wrong project.

Env vars must be set in Vercel for all three of Production/Preview/Development. When scripting `vercel env add` on Windows, don't pipe the value through a PowerShell string pipe (`"value" | npx vercel ...`) — the pipeline encoding can inject stray characters (this silently corrupted the Dropbox credentials once, causing `invalid_client`). Redirect from a BOM-less file instead: `cmd /c "npx vercel env add NAME production < file.txt"`.

**Deploying does not run migrations.** If a push includes code that reads or writes a new column, the SQL must be applied to Supabase first or production breaks — see below.

### Applying new Supabase migrations

Nothing runs migrations automatically. After adding `supabase/migration_0NN_*.sql`, **the user must paste it into the Supabase dashboard's SQL Editor and run it**. Always say so explicitly in the completion summary when a change depends on one.

Symptom of a missed migration: Server Actions fail with `Could not find the '<column>' column of '<table>' in the schema cache`. If the column does exist, PostgREST's cache is stale — `notify pgrst, 'reload schema';`.

`alter table … add column if not exists` is safely re-runnable, but **`create policy` is not** — re-running a migration that creates RLS policies errors with `policy already exists`. Skip those blocks on a re-run.

Recent migrations: `012` result + next_action, `013` next_action_date, `014` decision, `015` schedule project link, `016` checklist folders.

### Working across multiple machines

The working copy lives inside a Dropbox-synced folder (so `.env.local` and sources follow you between machines), but **`.git`, `node_modules`, and `.next` are excluded from Dropbox sync per machine** via the `com.dropbox.ignored` NTFS attribute — syncing a live `.git` risks corruption if two machines write at once, and syncing build output causes file-lock errors mid-build.

The attribute lives **on the directory itself**, so deleting one (e.g. wiping `.next` to clear a bad Turbopack cache) throws it away: the folder Next.js recreates is unmarked, Dropbox starts syncing it, and the dev server fails with `EPERM: operation not permitted, rename …/.next/dev/…-manifest.json.tmp…` or Turbopack panics with `Next.js package not found` while the browser spins forever. Re-apply it right after any such deletion. PowerShell needs an **absolute** path for the alternate-data-stream syntax — with a relative one it reads `node_modules:` as a drive name and reports the attribute missing when it isn't:

```powershell
Set-Content -LiteralPath 'C:\full\path\to\work-journal\.next:com.dropbox.ignored' -Value 1
```

The same `EPERM` also appears when two dev servers briefly overlap — check for a stale `next dev` process before blaming Dropbox.

Practical upshot: **git push/pull is the real sync mechanism between machines**, not Dropbox. Commit and push before switching machines, pull before starting. `node_modules` must be regenerated per machine.
