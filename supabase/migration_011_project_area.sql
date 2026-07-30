-- ============================================================
-- 프로젝트 면적 정보 (대지/건축/연면적) - 건폐율/용적률은 저장하지 않고 화면에서 계산
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.projects
  add column if not exists site_area numeric check (site_area is null or site_area >= 0),
  add column if not exists building_area numeric check (building_area is null or building_area >= 0),
  add column if not exists total_floor_area numeric check (total_floor_area is null or total_floor_area >= 0);
