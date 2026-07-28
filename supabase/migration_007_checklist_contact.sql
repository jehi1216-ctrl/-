-- ============================================================
-- 체크리스트 담당자를 협력업체(project_contacts)와 연동
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

alter table public.project_checklist_items
  add column if not exists assignee_contact_id uuid references public.project_contacts(id) on delete set null;
