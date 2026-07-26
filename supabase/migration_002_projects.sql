-- ============================================================
-- 프로젝트(현장) 단위 관리 + 파일 첨부 기능 추가
-- Supabase SQL Editor에서 schema.sql 실행 이후에 그대로 실행하세요.
-- ============================================================

-- ============================================================
-- 1. projects (프로젝트/현장)
-- ============================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,                    -- 프로젝트명
  client text,                           -- 발주처
  site_address text,                     -- 현장주소
  phase text not null default 'design'   -- 공정단계
    check (phase in ('design', 'permit', 'construction', 'completed')),
  start_date date,                       -- 시작일
  expected_completion_date date,         -- 준공예정일
  contract_amount numeric,               -- 공사금액
  contract_info text,                    -- 계약정보(계약번호, 조건 등 자유 기술)
  manager_name text,                     -- 담당자명
  manager_phone text,                    -- 담당자 연락처
  progress_notes text,                   -- 진행사항(현재 상태 요약)
  created_at timestamptz not null default now()
);

create index if not exists projects_user_idx
  on public.projects (user_id, created_at desc);

alter table public.projects enable row level security;

create policy "select own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 2. project_contacts (협력업체)
-- ============================================================

create table if not exists public.project_contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  trade text,                            -- 공종/역할 (예: 전기, 설비, 목공)
  company text not null,                 -- 업체명
  contact_name text,                     -- 담당자명
  phone text,                            -- 전화번호
  created_at timestamptz not null default now()
);

create index if not exists project_contacts_project_idx
  on public.project_contacts (project_id);

alter table public.project_contacts enable row level security;

create policy "select own project_contacts"
  on public.project_contacts for select
  using (auth.uid() = user_id);

create policy "insert own project_contacts"
  on public.project_contacts for insert
  with check (auth.uid() = user_id);

create policy "update own project_contacts"
  on public.project_contacts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own project_contacts"
  on public.project_contacts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 3. work_logs: 프로젝트 소속 추가 (기존 테이블 변경)
-- ============================================================

alter table public.work_logs
  add column if not exists project_id uuid references public.projects (id) on delete cascade;

-- project_id가 비어있는 기존 행이 있으면, 사용자별로 "미분류 업무" 프로젝트를 만들어 자동으로 옮겨줍니다.
do $$
declare
  r record;
  new_project_id uuid;
begin
  for r in select distinct user_id from public.work_logs where project_id is null loop
    insert into public.projects (user_id, name)
    values (r.user_id, '미분류 업무')
    returning id into new_project_id;

    update public.work_logs
    set project_id = new_project_id
    where user_id = r.user_id and project_id is null;
  end loop;
end $$;

alter table public.work_logs
  alter column project_id set not null;

create index if not exists work_logs_project_idx
  on public.work_logs (project_id, date desc);

-- ============================================================
-- 4. project_files (사진/문서 첨부 - 개별 기록 또는 프로젝트 공용)
-- ============================================================

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  work_log_id uuid references public.work_logs (id) on delete cascade,  -- null이면 프로젝트 공용 문서함
  user_id uuid not null references auth.users (id) on delete cascade,
  file_path text not null,               -- Storage 상의 경로
  file_name text not null,               -- 원본 파일명
  file_type text,                        -- MIME 타입
  file_size bigint,                      -- 바이트
  created_at timestamptz not null default now()
);

create index if not exists project_files_project_idx
  on public.project_files (project_id, created_at desc);

create index if not exists project_files_work_log_idx
  on public.project_files (work_log_id);

alter table public.project_files enable row level security;

create policy "select own project_files"
  on public.project_files for select
  using (auth.uid() = user_id);

create policy "insert own project_files"
  on public.project_files for insert
  with check (auth.uid() = user_id);

create policy "delete own project_files"
  on public.project_files for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 5. Storage 버킷 + 정책 (사진/문서 저장용)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

-- 파일 경로 규칙: {user_id}/{project_id}/{filename}
-- 본인 폴더(맨 앞 경로가 자신의 user_id)에만 업로드/조회/삭제 가능

create policy "select own storage files"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "insert own storage files"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own storage files"
  on storage.objects for delete
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
