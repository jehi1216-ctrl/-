-- ============================================================
-- 공정단계에 '감리' 추가 (시공과 준공 사이, BUILD 그룹)
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.projects
  drop constraint if exists projects_phase_check;

alter table public.projects
  add constraint projects_phase_check
  check (phase in ('design', 'permit', 'construction', 'supervision', 'completed'));
