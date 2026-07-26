-- ============================================================
-- 업무 일지 (work_logs) 스키마
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default (timezone('utc', now()))::date,
  content text not null,
  category text not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'done')),
  created_at timestamptz not null default now()
);

-- 목록/필터 조회 성능을 위한 인덱스
create index if not exists work_logs_user_date_idx
  on public.work_logs (user_id, date desc, created_at desc);

create index if not exists work_logs_user_category_idx
  on public.work_logs (user_id, category);

-- ============================================================
-- Row Level Security: 각 사용자는 자신의 데이터만 조회/수정 가능
-- ============================================================

alter table public.work_logs enable row level security;

create policy "select own logs"
  on public.work_logs
  for select
  using (auth.uid() = user_id);

create policy "insert own logs"
  on public.work_logs
  for insert
  with check (auth.uid() = user_id);

create policy "update own logs"
  on public.work_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own logs"
  on public.work_logs
  for delete
  using (auth.uid() = user_id);
