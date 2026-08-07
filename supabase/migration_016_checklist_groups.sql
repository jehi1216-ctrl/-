-- ============================================================
-- 체크리스트 폴더(그룹) — 예: "설계변경 보완사항"
--   현장 아래에 폴더를 두고, 체크리스트 항목을 폴더에 담는다.
--   group_id 가 null 인 항목은 '폴더 없음'으로 그대로 표시된다(기존 항목 전부 해당).
--   폴더를 지워도 항목은 남기고 연결만 끊는다(on delete set null).
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

create table if not exists public.project_checklist_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_checklist_groups_project_id_idx
  on public.project_checklist_groups (project_id);

alter table public.project_checklist_groups enable row level security;

create policy "select own project_checklist_groups"
  on public.project_checklist_groups for select
  using (auth.uid() = user_id);

create policy "insert own project_checklist_groups"
  on public.project_checklist_groups for insert
  with check (auth.uid() = user_id);

create policy "update own project_checklist_groups"
  on public.project_checklist_groups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own project_checklist_groups"
  on public.project_checklist_groups for delete
  using (auth.uid() = user_id);

alter table public.project_checklist_items
  add column if not exists group_id uuid
    references public.project_checklist_groups (id) on delete set null;

create index if not exists project_checklist_items_group_id_idx
  on public.project_checklist_items (group_id)
  where group_id is not null;
