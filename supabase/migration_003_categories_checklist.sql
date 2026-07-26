-- ============================================================
-- 카테고리 다중 선택 + 소요시간 제거 + 프로젝트 체크리스트
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

-- ============================================================
-- 1. work_logs: category(단일) -> categories(배열), duration_minutes 제거
-- ============================================================

alter table public.work_logs
  add column if not exists categories text[] not null default '{}';

update public.work_logs
set categories = array[category]
where categories = '{}' and category is not null and category <> '';

alter table public.work_logs drop column if exists category;
alter table public.work_logs drop column if exists duration_minutes;

-- ============================================================
-- 2. project_checklist_items (프로젝트 체크리스트)
-- ============================================================

create table if not exists public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,        -- 할 일
  assignee text,                -- 담당자
  due_date date,                -- 마감일
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists project_checklist_items_project_idx
  on public.project_checklist_items (project_id, is_done, due_date);

alter table public.project_checklist_items enable row level security;

create policy "select own checklist items"
  on public.project_checklist_items for select
  using (auth.uid() = user_id);

create policy "insert own checklist items"
  on public.project_checklist_items for insert
  with check (auth.uid() = user_id);

create policy "update own checklist items"
  on public.project_checklist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own checklist items"
  on public.project_checklist_items for delete
  using (auth.uid() = user_id);
