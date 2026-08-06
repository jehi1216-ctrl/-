-- ============================================================
-- '내가 할 일'에 선택적 마감일 추가 (캘린더 연동용)
--   next_action_date : status = 'todo' 일 때만 의미가 있다. 비워둘 수 있다.
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.work_logs
  add column if not exists next_action_date date;

-- 캘린더는 월 범위로 조회하므로 사용자+날짜 인덱스를 둔다.
create index if not exists work_logs_user_next_action_date_idx
  on public.work_logs (user_id, next_action_date)
  where next_action_date is not null;
