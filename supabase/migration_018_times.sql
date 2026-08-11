-- ============================================================
-- 캘린더에 뜨는 항목에 '시간'을 붙인다. 셋 다 선택이며, 비워두면 예전처럼 날짜만 쓴다.
--   schedule_items.start_time  : 일정 시각
--   work_logs.next_action_time : 할 일 마감 시각 (next_action_date 와 짝)
--   work_logs.decision_dates   : jsonb 안에 "time" 키가 늘어난다 — 컬럼 변경 없음
--     [{ "date": "YYYY-MM-DD", "time": "HH:MM", "content": "..." }, ...]
--
-- 컬럼명을 time 이 아니라 start_time 으로 둔 것은 time 이 타입 이름이라
-- 따옴표 없이 쓰면 걸리는 자리가 생기기 때문이다.
-- 여러 번 다시 돌려도 안전하다.
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.schedule_items
  add column if not exists start_time time;

alter table public.work_logs
  add column if not exists next_action_time time;

notify pgrst, 'reload schema';
