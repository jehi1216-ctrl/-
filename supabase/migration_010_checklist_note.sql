-- ============================================================
-- 체크리스트 항목별 코멘트(메모) 추가
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.project_checklist_items
  add column if not exists note text;
