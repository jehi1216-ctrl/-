-- ============================================================
-- 일정(schedule_items)에 현장 연결 추가
--   project_id : 선택. 지정하면 캘린더에서 그 현장 색으로 표시된다.
--                비워두면 현장 없는 일정(회색)으로 그대로 동작한다.
--   현장을 지워도 일정은 남기고 연결만 끊는다(on delete set null).
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.schedule_items
  add column if not exists project_id uuid
    references public.projects (id) on delete set null;

create index if not exists schedule_items_project_id_idx
  on public.schedule_items (project_id)
  where project_id is not null;
