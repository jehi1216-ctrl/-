-- ============================================================
-- 할 일 / 일정 (날짜 + 내용, 캘린더 표시용)
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  content text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists schedule_items_user_date_idx
  on public.schedule_items (user_id, date);

alter table public.schedule_items enable row level security;

create policy "select own schedule_items"
  on public.schedule_items for select
  using (auth.uid() = user_id);

create policy "insert own schedule_items"
  on public.schedule_items for insert
  with check (auth.uid() = user_id);

create policy "update own schedule_items"
  on public.schedule_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own schedule_items"
  on public.schedule_items for delete
  using (auth.uid() = user_id);
