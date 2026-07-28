-- ============================================================
-- DESIGN / BUILD 일지 구분 (log_type)
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.work_logs
  add column if not exists log_type text not null default 'design'
  check (log_type in ('design', 'build'));

create index if not exists work_logs_user_log_type_idx
  on public.work_logs (user_id, log_type);
