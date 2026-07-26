-- ============================================================
-- 카테고리 세분화 (검토/설계 하위항목, 대관 공종×단계, 협의/PT/공사/브랜딩 회차)
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.work_logs
  add column if not exists category_details jsonb not null default '{}'::jsonb;
