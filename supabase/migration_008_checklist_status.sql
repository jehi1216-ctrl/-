-- ============================================================
-- 체크리스트 상태 (준비/협의중/진행중/완료) - 마감일 대신 사용
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.project_checklist_items
  add column if not exists status text not null default '준비'
  check (status in ('준비', '협의중', '진행중', '완료'));
