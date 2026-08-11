-- ============================================================
-- 종료하면서 '협의된 날짜'를 함께 남길 수 있게 추가
--   decision_dates : status = 'done' 일 때만 의미가 있다. 비워둘 수 있다.
--   [{ "date": "YYYY-MM-DD", "content": "그날 무엇이 있는지" }, ...] 형태.
--   협의 결과가 하루로 끝나지 않고(예: 3일에 걸친 심의) 날마다 내용이 달라
--   date/date[] 가 아니라 jsonb 로 둔다.
--   next_action_date(할 일 마감)와는 다른 뜻이라 컬럼을 따로 둔다 —
--   마감은 '내가 해야 할 날', 이건 '종료하며 협의된 날'이다.
--   값이 있으면 그 날짜마다 캘린더에 '결정'으로 찍힌다.
--
-- 이 파일은 개발 중 모양이 세 번 바뀌었다(date → date[] → jsonb).
-- 그래서 어느 판을 이미 돌렸든, 아직 아무것도 안 돌렸든 똑같이 끝나도록 썼다.
-- 적어둔 값은 새 모양으로 옮겨지며, 여러 번 다시 돌려도 안전하다.
-- create policy 가 없으므로 재실행해도 'policy already exists' 가 나지 않는다.
--
-- 형 변환에 ALTER COLUMN ... USING 을 쓰지 않는다 — USING 식에는 서브쿼리를 넣을 수
-- 없어서(cannot use subquery in transform expression) 배열을 풀어 담을 방법이 없다.
-- 새 칼럼에 옮겨 담고 이름을 바꿔치기한다.
-- Supabase SQL Editor에서 그대로 실행하세요.
-- ============================================================

-- 1) decision_dates 를 jsonb 로 맞춘다.
--    없으면 만들고, 예전 date[] 판이면 값을 살린 채 옮긴다.
do $$
declare
  col_type text;
begin
  select data_type into col_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'work_logs'
    and column_name = 'decision_dates';

  if col_type is null then
    execute 'alter table public.work_logs add column decision_dates jsonb';

  elsif col_type = 'ARRAY' then
    -- date[] 에는 날짜만 있으므로 내용(content)은 빈 문자열로 채워 옮긴다.
    -- DDL 직후의 문장은 EXECUTE 로 돌려 계획 캐시가 옛 스키마를 붙들지 않게 한다.
    execute 'alter table public.work_logs add column decision_dates_jsonb jsonb';

    execute $q$
      update public.work_logs w
         set decision_dates_jsonb = (
               select jsonb_agg(
                        jsonb_build_object('date', to_char(t.d, 'YYYY-MM-DD'), 'content', '')
                        order by t.d
                      )
               from unnest(w.decision_dates) as t(d)
             )
       where w.decision_dates is not null
    $q$;

    execute 'alter table public.work_logs drop column decision_dates';
    execute 'alter table public.work_logs rename column decision_dates_jsonb to decision_dates';
  end if;
end $$;

-- 2) 맨 처음 판의 decision_date(단수, date)가 남아 있으면 값을 옮기고 지운다.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_logs'
      and column_name = 'decision_date'
  ) then
    execute $q$
      update public.work_logs
         set decision_dates = jsonb_build_array(
               jsonb_build_object('date', to_char(decision_date, 'YYYY-MM-DD'), 'content', '')
             )
       where decision_date is not null
         and decision_dates is null
    $q$;

    execute 'alter table public.work_logs drop column decision_date';
  end if;
end $$;

-- 3) PostgREST 스키마 캐시를 갱신한다(컬럼을 바꾼 뒤 바로 쓰기 위해).
notify pgrst, 'reload schema';
