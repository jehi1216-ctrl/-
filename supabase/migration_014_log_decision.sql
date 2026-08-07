-- ============================================================
-- 일지를 종료할 때 함께 남기는 '결정사항' 추가
--   decision : status = 'done' 일 때만 의미가 있다. 비워둘 수 있다(그냥 종료).
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.work_logs
  add column if not exists decision text;
