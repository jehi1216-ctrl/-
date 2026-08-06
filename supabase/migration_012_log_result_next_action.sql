-- ============================================================
-- 일지 흐름 개편: 기록 → 결과 → 상태
--   result      : 그 업무의 결과 (선택)
--   next_action : 상태가 'todo'일 때 내가 할 일 (선택)
--   status      : in_progress/done → todo/waiting/done
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.work_logs
  add column if not exists result text;

alter table public.work_logs
  add column if not exists next_action text;

-- status 값 교체: 기존 check 제약을 떼고 데이터를 옮긴 뒤 다시 건다.
-- (migration_009의 phase 제약과 같은 방식 — 원래 제약 정의를 다시 실행하면 안 된다)
alter table public.work_logs
  drop constraint if exists work_logs_status_check;

alter table public.work_logs
  alter column status drop default;

update public.work_logs
  set status = 'todo'
  where status = 'in_progress';

alter table public.work_logs
  add constraint work_logs_status_check
  check (status in ('todo', 'waiting', 'done'));

alter table public.work_logs
  alter column status set default 'todo';
