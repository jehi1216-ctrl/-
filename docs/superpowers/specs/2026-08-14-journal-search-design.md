# 전체 목록 검색 (`/journal` 키워드 검색) 설계

작성일: 2026-08-14

## 목적

`/journal`(전체 건축일지)에서 검색어를 입력하면 그 단어가 들어간 일지만 남긴다.
지금은 DESIGN/BUILD · 프로젝트 · 카테고리 · 세부 카테고리 필터뿐이라, "심의 얘기 나왔던 그 일지"를
찾으려면 날짜를 기억해 스크롤해야 한다.

## 정해진 것

| 항목 | 결정 | 이유 |
|---|---|---|
| 매칭 | 부분일치 포함 검색 (대소문자 무시) | '대수선'으로 '대수선신고'도 걸려야 한다. 의미 기반 검색은 임베딩·마이그레이션·API 비용이 붙어 제외 |
| 범위 | 일지에 타이핑된 모든 글 | 어느 칸에 썼는지 기억할 필요가 없어야 한다 |
| 여러 단어 | AND | 단어를 더할수록 좁아져야 목록 좁히기라는 목적에 맞는다 |
| 입력 | 엔터/버튼 제출 | 서버 렌더링 한 번으로 끝나고, 한글 조합 중 글자로 인한 중간 결과가 없다 |
| 거르는 곳 | 서버 컴포넌트의 JS 필터 | 아래 "접근 선택" 참고 |
| 하이라이트 | 이번 범위 밖 | `JournalEntryCard`에 props를 뚫어야 하고 이 카드는 다른 화면에서도 쓰인다 |

## 접근 선택

**채택 — 페이지에서 JS로 거르기.** `/journal`은 이미 사용자의 일지를 페이지네이션 없이 전부 가져오고,
세부 카테고리(`sub`) 필터도 이미 같은 자리에서 JS로 거른다. 일반 칸과 jsonb(협의된 날짜 내용, 안건 제목)를
한 함수에서 똑같이 훑을 수 있고 마이그레이션이 없다.
한계는 일지가 수천 건이 되면 느려지는 것 — 이 화면이 지금도 가진 한계와 같다.

**기각 — Supabase `.or(ilike)` 서버 필터.** `decision_dates`와 `category_details`는 jsonb라 PostgREST가
부분일치로 거르지 못한다. DB가 먼저 걸러 내보내면 "jsonb에만 단어가 있는 일지"를 되살릴 수 없어 결국
전건을 가져와야 한다. AND 다중 토큰이면 `.or()`를 토큰마다 겹쳐야 해 문법도 지저분해진다.

**기각 — Postgres 전문검색(tsvector + GIN).** 한국어 형태소 분석기가 없어 어절 단위 완전일치가 되므로
위에서 정한 부분일치와 어긋난다. jsonb는 여전히 별도 처리이고, 손으로 실행해야 하는 마이그레이션이 는다.
일지가 정말 많아지면 그때 갈아타되, 화면 코드는 그대로 둘 수 있게 매칭 규칙을 파일 하나로 모아 둔다.

## 구성

### `src/lib/logSearch.ts` (신규)

검색 규칙이 사는 유일한 곳. 화면은 이 세 함수만 안다.

- `parseQuery(raw: string): string[]` — 앞뒤 공백을 떼고 소문자화한 뒤 공백으로 자른 토큰 배열.
  빈 문자열·공백뿐이면 `[]`.
- `logHaystack(log: WorkLog): string` — 그 일지의 모든 글을 소문자로 이어 붙인 한 덩어리.
  모으는 값: `content`, `next_action`, `result`, `decision`, `decision_dates[].content`,
  `category_details`의 `협의`/`PT`/`브랜딩`의 `title`.
  `decision_dates`는 **반드시 `parseDecisionDates()`를 거쳐** 읽는다(jsonb라 손상된 행이 올 수 있다).
  날짜·카테고리 태그·프로젝트명은 넣지 않는다 — 화면에 이미 전용 필터가 있다.
- `matchesQuery(log: WorkLog, tokens: string[]): boolean` — 토큰이 **전부** haystack에 있으면 `true`.
  토큰이 `[]`면 `true`(검색어 없음 = 거르지 않음).

한 덩어리로 잇기 때문에 토큰이 서로 다른 칸에 흩어져 있어도 걸린다 — '양평'이 코멘트에,
'심의'가 본문에 있어도 `양평 심의`로 찾을 수 있다.

### `src/app/(main)/journal/page.tsx` (수정)

- `searchParams`에 `q?: string` 추가.
- `buildHref()`의 override 타입과 파라미터 조립에 `q` 추가 — 검색 중에 DESIGN 칩이나 프로젝트를
  바꿔도 검색어가 유지되고 기존 필터와 AND로 겹친다.
- `sub` 필터 **바로 다음**에 한 줄:
  검색 토큰이 있으면 `allLogs = allLogs.filter((log) => matchesQuery(log, tokens))`.
  `allLogs`를 좁히면 날짜 그룹, 상단 '일지 미처리' 모아보기(이미 `allLogs`에서 파생),
  첨부파일 조회(`logIds`)가 전부 따라 좁아진다. 그 아래는 손대지 않는다.
- 제목 아래 · 필터 칩 줄 위에 `<JournalSearchBox />`를 전체 폭으로 렌더.
- 검색 중이면 날짜 필터 안내와 같은 모양으로 한 줄: `'양평 심의' 검색 중 · 해제`.
  '해제'는 `buildHref({ q: undefined })`. 화면에 보여 주는 검색어는 `q`를 trim한 값이고, 토큰이 하나 이상일 때만(= 공백뿐이 아닐 때만) 이 줄이 뜬다.
- 결과 0건 문구: 검색 중이면 `'양평 심의'에 맞는 일지가 없어요.`, 아니면 지금 문구 그대로.

### `src/components/JournalSearchBox.tsx` (신규, 클라이언트)

`ProjectFilterSelect`와 같은 패턴(`useSearchParams` + `router.push`). 차이는 `<form onSubmit>`이라
엔터 또는 돋보기 버튼에서만 이동한다는 것.

- `defaultValue`는 `searchParams.get("q") ?? ""`.
- 제출 시 값이 있으면 `params.set("q", value.trim())`, 비었으면 `params.delete("q")` 후
  `router.push('/journal?' + params.toString())`.
- 다른 파라미터는 `searchParams`를 그대로 복사해 유지한다.

## 데이터 흐름

```
?q=양평 심의
  → page.tsx: parseQuery("양평 심의") → ["양평", "심의"]
  → Supabase에서 (type/category/project/date 필터로) 일지 조회
  → sub 필터(JS) → 검색 필터(JS, matchesQuery)
  → groupByDate / openLogs / project_files 조회가 모두 좁혀진 목록에서 파생
```

## 오류·경계

- `q`가 공백뿐 → 토큰 `[]` → 거르지 않음. URL에는 남지만 안내 줄과 0건 문구는 뜨지 않는다.
- `decision_dates`가 깨진 jsonb → `parseDecisionDates()`가 흘린다. 검색이 예외로 죽지 않는다.
- `category_details`에 `title`이 없거나 빈 문자열 → 그냥 haystack에 안 들어간다.
- 알 수 없는 `q` 값은 있을 수 없다(자유 텍스트). 다른 파라미터의 폴백 동작은 그대로.

## 검증

테스트 스위트가 없으므로 다음으로 확인한다.

1. `npm run lint` · `npx tsc --noEmit` · `npm run build` (dev 서버를 끄고 — 동시에 `.next`를 쓰면 EPERM)
2. 수동 확인
   - 한 단어 검색이 본문에 그 단어가 있는 일지만 남긴다
   - 코멘트(`result`)에만 있는 단어로도 찾힌다
   - 두 단어가 서로 다른 칸에 흩어져 있어도 AND로 걸린다
   - 검색 + 프로젝트/카테고리 필터가 함께 걸린다(칩을 눌러도 검색어 유지)
   - 0건일 때 검색어를 넣은 문구가 뜬다
   - '해제'와 빈 값 제출이 `q`를 지운다
   - 뒤로가기로 이전 검색 상태로 돌아간다
   - 상단 '일지 미처리' 모아보기도 함께 좁아진다

마이그레이션 없음 — Supabase SQL 에디터에서 할 일이 없다.

## 범위 밖

- 결과 하이라이트
- 다른 화면(`/weekly`, `/projects/[id]`)의 검색
- 프로젝트명·카테고리 태그 검색 (전용 필터가 이미 있다)
- 검색어 자동완성·최근 검색어
