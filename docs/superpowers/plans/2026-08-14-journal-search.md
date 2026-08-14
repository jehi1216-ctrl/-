# 전체 목록 키워드 검색 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/journal`(전체 건축일지)에서 검색어를 입력하면, 그 단어가 일지 어딘가에 들어간 일지만 남긴다.

**Architecture:** 매칭 규칙은 `src/lib/logSearch.ts` 하나에 모으고, 서버 컴포넌트인 `page.tsx`가 이미 전건을 가져와 세부 카테고리를 JS로 거르는 그 자리에서 검색도 함께 거른다. 검색어는 React state가 아니라 `?q=` search param에 산다 — 이 앱의 다른 드릴다운과 같은 방식이라 뒤로가기·링크 공유가 그냥 된다. DB 스키마 변경 없음.

**Tech Stack:** Next.js 16 App Router + React 19 + TypeScript + Tailwind, Supabase(PostgREST). 새 의존성 없음.

설계 문서: `docs/superpowers/specs/2026-08-14-journal-search-design.md`

## Global Constraints

- **이 레포에는 테스트 스위트가 없다.** 그래서 각 태스크의 검증은 `npx tsc --noEmit` · `npm run lint` · `npm run dev`에서의 육안 확인이다. 새 테스트 러너를 들이지 말 것 — 설계에서 명시적으로 범위 밖으로 뒀다.
- `npm run build`는 **dev 서버를 끈 뒤에** 돌린다. 둘 다 `.next`에 쓰기 때문에 겹치면 `EPERM`이 나고 dev가 모든 라우트에서 500을 뱉는다.
- **`.next` 디렉터리를 지우지 말 것.** Dropbox 제외 속성(`com.dropbox.ignored`)이 디렉터리에 붙어 있어 지우면 날아간다.
- `decision_dates`(jsonb)는 **반드시 `parseDecisionDates()`를 거쳐** 읽는다. 직접 `.map()` 하지 말 것.
- Tailwind 클래스는 **완전한 문자열**로 쓴다. 런타임에 조립한 클래스명은 purge된다.
- import는 `@/` alias를 쓴다 (`@/lib/...`, `@/components/...`, `@/types/...`).
- 커밋 메시지는 한 줄 요약 + `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **`master`에 push하면 Vercel로 자동 배포된다.** 이 계획의 어느 태스크도 push하지 않는다. 커밋까지만 하고, push는 사용자가 따로 지시할 때 한다.
- 마이그레이션 없음 — Supabase SQL 에디터에서 할 일이 없다.

---

## File Structure

| 파일 | 역할 |
|---|---|
| `src/lib/logSearch.ts` (신규) | 검색 규칙 전부 — 검색어 자르기, 일지에서 검색 대상 글 모으기, 매칭 판정. 화면은 이 세 함수만 안다 |
| `src/app/(main)/journal/page.tsx` (수정) | `?q=` 읽기, 목록에 매칭 적용, `buildHref`에 `q` 보존, 검색 중 안내 줄·0건 문구 |
| `src/components/JournalSearchBox.tsx` (신규, 클라이언트) | 입력창 + 제출. 제출 시에만 `?q=`를 붙여 이동 |
| `CHANGELOG.md` (수정) | 이 레포 관례대로 변경 기록 |

---

## Task 1: 검색 규칙 모듈

**Files:**
- Create: `src/lib/logSearch.ts`

**Interfaces:**
- Consumes: `WorkLog`, `parseDecisionDates`, `NUMBERED_CATEGORIES` (모두 `@/types/journal`에 이미 있음)
- Produces:
  - `parseQuery(raw: string | undefined): string[]`
  - `logHaystack(log: WorkLog): string`
  - `matchesQuery(log: WorkLog, tokens: string[]): boolean`

- [ ] **Step 1: 파일 생성**

`src/lib/logSearch.ts`:

```ts
import {
  NUMBERED_CATEGORIES,
  parseDecisionDates,
  type WorkLog,
} from "@/types/journal";

// 검색어를 공백으로 잘라 소문자 토큰으로 만든다.
// 빈 문자열이나 공백뿐이면 빈 배열 — "거르지 않는다"는 뜻으로 쓴다.
export function parseQuery(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

// 일지에 타이핑된 글을 전부 한 덩어리로 잇는다.
// 칸을 나누지 않는 건 의도 — '양평'이 코멘트에, '심의'가 본문에 있어도 걸려야 한다.
// 날짜·카테고리 태그·프로젝트명은 넣지 않는다. 화면에 이미 전용 필터가 있다.
export function logHaystack(log: WorkLog): string {
  const parts: string[] = [
    log.content,
    log.next_action ?? "",
    log.result ?? "",
    log.decision ?? "",
  ];

  // jsonb라 무엇이든 올 수 있다 — 읽는 쪽은 전부 parseDecisionDates를 거친다.
  for (const entry of parseDecisionDates(log.decision_dates)) {
    parts.push(entry.content);
  }

  // 번호가 붙은 안건의 제목(협의-02: 신현중학교 최초 미팅)도 내가 타이핑한 글이다.
  for (const name of NUMBERED_CATEGORIES) {
    const numbered = log.category_details?.[name];
    if (numbered?.title) parts.push(numbered.title);
  }

  return parts.join("\n").toLowerCase();
}

// 토큰이 전부 들어 있어야 한다(AND). 토큰이 없으면 통과.
export function matchesQuery(log: WorkLog, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = logHaystack(log);
  return tokens.every((token) => haystack.includes(token));
}
```

- [ ] **Step 2: 타입 검사**

Run: `npx tsc --noEmit`

Expected: 에러 없이 종료(코드 0). `log.category_details?.[name]`이 `NumberedEntry | undefined`로 좁혀지는지가 핵심 — 에러가 나면 `NUMBERED_CATEGORIES`가 `readonly ["협의","PT","브랜딩"]`인지 `src/types/journal.ts`에서 확인한다.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/logSearch.ts
git commit -m "Add the matching rules for journal keyword search

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: 목록에 검색 적용 (`?q=`)

검색창 없이 **주소창에 `?q=`를 직접 쳐서** 동작을 확인할 수 있는 단위다. UI는 다음 태스크.

**Files:**
- Modify: `src/app/(main)/journal/page.tsx` (import 블록 / `searchParams` 타입 51-57 / 구조분해 64-70 / `buildHref` 75-98 / `sub` 필터 뒤 132-135)

**Interfaces:**
- Consumes: Task 1의 `parseQuery`, `matchesQuery`
- Produces: `searchTokens: string[]`, `searchLabel: string` — Task 3의 안내 줄과 0건 문구가 이 둘을 쓴다

- [ ] **Step 1: import 추가**

파일 위 import 블록의 `import type { Project, ProjectFile } from "@/types/project";` **아래**에 한 줄:

```ts
import { parseQuery, matchesQuery } from "@/lib/logSearch";
```

- [ ] **Step 2: `searchParams` 타입에 `q` 추가**

```ts
  searchParams: Promise<{
    type?: string;
    category?: string;
    sub?: string;
    project?: string;
    date?: string;
    q?: string;
  }>;
```

- [ ] **Step 3: 구조분해에 `q`를 넣고 토큰을 만든다**

기존 구조분해를 이렇게 바꾼다:

```ts
  const {
    type: activeTypeRaw,
    category: activeCategory,
    sub: activeSub,
    project: activeProject,
    date: activeDate,
    q: rawQuery,
  } = await searchParams;

  // 공백뿐인 검색어는 토큰이 0개가 되어 아무것도 거르지 않는다.
  const searchTokens = parseQuery(rawQuery);
  const searchLabel = rawQuery?.trim() ?? "";
```

- [ ] **Step 4: `buildHref`가 `q`를 보존하게 한다**

override 타입, `next` 객체, 파라미터 조립 세 곳 모두에 `q`를 넣는다. 이게 있어야 검색 중에 DESIGN 칩이나 프로젝트를 바꿔도 검색어가 유지되고 필터와 AND로 겹친다.

```ts
  function buildHref(overrides: {
    type?: string;
    category?: string;
    sub?: string;
    project?: string;
    date?: string;
    q?: string;
  }) {
    const params = new URLSearchParams();
    const next = {
      type: activeType,
      category: activeCategory,
      sub: activeSub,
      project: activeProject,
      date: activeDate,
      q: rawQuery,
      ...overrides,
    };
    if (next.type) params.set("type", next.type);
    if (next.category) params.set("category", next.category);
    if (next.sub) params.set("sub", next.sub);
    if (next.project) params.set("project", next.project);
    if (next.date) params.set("date", next.date);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    return qs ? `/journal?${qs}` : "/journal";
  }
```

- [ ] **Step 5: 세부 카테고리 필터 바로 뒤에서 거른다**

기존 `sub` 필터 블록:

```ts
  if (activeSub && activeCategory && activeType !== "build" && SUBCATEGORY_OPTIONS[activeCategory]) {
    allLogs = allLogs.filter((log) => getSubValues(log, activeCategory).includes(activeSub));
  }
```

**바로 아래**에 붙인다 (`const grouped = groupByDate(allLogs);` 위):

```ts
  if (searchTokens.length > 0) {
    allLogs = allLogs.filter((log) => matchesQuery(log, searchTokens));
  }
```

여기서 좁히면 아래가 전부 따라온다 — 날짜 그룹, 상단 '일지 미처리' 모아보기(이미 `allLogs`에서 파생), 첨부파일 조회(`logIds`). 그 아래 코드는 손대지 않는다.

- [ ] **Step 6: 타입 검사와 린트**

Run: `npx tsc --noEmit && npm run lint`

Expected: 둘 다 에러 없음.

- [ ] **Step 7: 주소창으로 동작 확인**

Run: `npm run dev` (이미 떠 있으면 그대로 쓴다 — 두 개를 겹쳐 띄우지 말 것)

브라우저에서 순서대로 확인:

1. `http://localhost:3000/journal` — 지금까지와 똑같이 전부 나온다
2. `http://localhost:3000/journal?q=심의` — '심의'가 들어간 일지만 남는다
3. 본문에는 없고 **코멘트에만** 있는 단어로 검색 → 그 일지가 나온다
4. 서로 다른 칸에 흩어진 두 단어(예: `양평 심의`)로 검색 → AND로 걸린다
5. `?q=심의&type=design` — 검색과 필터가 함께 걸린다. 화면의 BUILD 칩을 눌러 보면 주소에 `q=심의`가 그대로 남아 있다
6. `?q=` (빈 값) — 아무것도 걸러지지 않는다
7. 상단 '일지 미처리' 모아보기도 함께 좁아진다

- [ ] **Step 8: 커밋**

```bash
git add "src/app/(main)/journal/page.tsx"
git commit -m "Filter the journal list by the q search param

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: 검색창과 화면 문구

**Files:**
- Create: `src/components/JournalSearchBox.tsx`
- Modify: `src/app/(main)/journal/page.tsx` (import 블록 / 헤더 블록 161-175 / 0건 문구 265-268)

**Interfaces:**
- Consumes: Task 2의 `searchTokens`, `searchLabel`, `buildHref`
- Produces: `JournalSearchBox` (default export, props 없음)

- [ ] **Step 1: 검색창 컴포넌트 생성**

`src/components/JournalSearchBox.tsx`. `ProjectFilterSelect`와 같은 패턴(`useSearchParams` + `router.push`)이되, 제출할 때만 이동한다:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";

export default function JournalSearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("q") ?? "";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = new FormData(e.currentTarget).get("q");
    const next = typeof raw === "string" ? raw.trim() : "";

    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("q", next);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.push(qs ? `/journal?${qs}` : "/journal");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {/* key={current} — '해제'로 q가 사라졌을 때 입력칸도 비워지도록.
          비제어 입력이라 defaultValue만으로는 이동해도 값이 그대로 남는다. */}
      <input
        key={current}
        type="search"
        name="q"
        defaultValue={current}
        placeholder="일지 내용 검색 (예: 양평 심의)"
        className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
      >
        검색
      </button>
    </form>
  );
}
```

- [ ] **Step 2: `page.tsx`에 import 추가**

`import OpenLogsSection from "@/components/OpenLogsSection";` 아래에:

```ts
import JournalSearchBox from "@/components/JournalSearchBox";
```

- [ ] **Step 3: 헤더에 안내 줄, 그 아래 검색창을 넣는다**

기존 헤더 블록(`<div className="space-y-6">` 바로 안쪽의 `<div>`)을 이렇게 바꾼다. 날짜 안내 줄 다음에 검색 안내 줄이 오고, 헤더 `</div>` **밖에** 검색창이 전체 폭으로 온다:

```tsx
      <div>
        <h1 className="text-lg font-semibold">전체 건축일지</h1>
        <p className="text-sm text-gray-500">
          날짜별로 모아 볼 수 있어요.
        </p>
        {activeDate && (
          <p className="mt-1 text-sm text-brand-700">
            {formatDateLabel(activeDate)} 필터링 중 ·{" "}
            <Link href={buildHref({ date: undefined })} className="underline">
              해제
            </Link>
          </p>
        )}
        {searchTokens.length > 0 && (
          <p className="mt-1 text-sm text-brand-700">
            ‘{searchLabel}’ 검색 중 ·{" "}
            <Link href={buildHref({ q: undefined })} className="underline">
              해제
            </Link>
          </p>
        )}
      </div>

      <JournalSearchBox />
```

- [ ] **Step 4: 0건 문구를 검색어에 맞춘다**

기존:

```tsx
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          조건에 맞는 건축일지가 없어요.
        </p>
```

이렇게 바꾼다:

```tsx
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          {searchTokens.length > 0
            ? `‘${searchLabel}’에 맞는 건축일지가 없어요.`
            : "조건에 맞는 건축일지가 없어요."}
        </p>
```

- [ ] **Step 5: 타입 검사와 린트**

Run: `npx tsc --noEmit && npm run lint`

Expected: 둘 다 에러 없음.

- [ ] **Step 6: 화면에서 확인**

Run: `npm run dev` (이미 떠 있으면 그대로)

`http://localhost:3000/journal`에서:

1. 제목 아래, 필터 칩 줄 위에 검색창이 전체 폭으로 있다
2. 단어를 치고 **엔터** → 목록이 좁아지고 주소에 `?q=`가 붙는다. 검색 버튼도 같게 동작한다
3. 제목 아래에 `‘양평 심의’ 검색 중 · 해제`가 뜬다
4. **해제**를 누르면 `q`가 사라지고 **입력칸도 비워진다**
5. 입력칸을 비우고 엔터 → 마찬가지로 `q`가 사라진다
6. 없는 단어를 치면 `‘…’에 맞는 건축일지가 없어요.`가 뜬다. 검색어 없이 필터만으로 0건일 때는 예전 문구 그대로다
7. 뒤로가기 → 이전 검색 상태로 돌아가고 입력칸 내용도 그에 맞는다
8. 브라우저 폭을 모바일 크기로 줄여도 검색창과 버튼이 한 줄에 들어간다

- [ ] **Step 7: 커밋**

```bash
git add src/components/JournalSearchBox.tsx "src/app/(main)/journal/page.tsx"
git commit -m "Add the search box and its empty-state copy to the journal list

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: 빌드 검증과 변경 기록

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: dev 서버를 끄고 빌드**

먼저 실행 중인 `next dev`를 종료한다(겹치면 `.next` 충돌로 `EPERM`).

Run: `npm run build`

Expected: 에러 없이 완료. 라우트 목록에 `/journal`이 나온다.

- [ ] **Step 2: CHANGELOG 항목 추가**

`# Changelog` 바로 아래에, 오늘 날짜 섹션을 만들어 넣는다:

```markdown
## 2026-08-14

- **전체 목록에 검색창 추가** — 마이그레이션 없음
  - 전체 건축일지에는 DESIGN/BUILD·프로젝트·카테고리 필터뿐이라, "심의 얘기 나왔던 그 일지"를 찾으려면 날짜를 기억해 스크롤해야 했음
  - 제목 아래 검색창에 단어를 치고 엔터를 누르면 그 단어가 들어간 일지만 남는다. **부분일치**라 `대수선`으로 `대수선신고`도 걸리고, 영문 대소문자는 무시한다
  - **일지에 타이핑한 글은 전부 대상이다** — 본문·할 일·코멘트·결정사항·협의된 날짜 내용·번호 붙은 안건 제목. 어느 칸에 썼는지 기억할 필요가 없게
  - 한 덩어리로 이어 붙여 찾기 때문에 **`양평 심의`처럼 두 단어가 서로 다른 칸에 흩어져 있어도 걸린다**. 여러 단어는 AND — 단어를 더할수록 좁아진다
  - 검색어는 **`?q=`로 주소에 남는다.** 뒤로가기·링크 공유가 되고, 검색 중에 필터 칩을 눌러도 검색어가 유지되며 필터와 겹쳐 걸린다
  - 상단 미처리 모아보기도 같은 목록에서 파생되므로 함께 좁아진다
  - 결과가 없으면 `‘양평 심의’에 맞는 건축일지가 없어요.`로, 무엇으로 찾다 비었는지 문구에 남긴다
  - **DB에서 거르지 않고 화면에서 거른다.** 협의된 날짜와 안건 제목이 jsonb라 PostgREST가 부분일치로 못 거르는데, DB가 먼저 걸러 보내면 그 두 곳에만 단어가 있는 일지를 되살릴 수 없다. 이 화면은 원래 전건을 가져와 세부 카테고리도 JS로 걸러 왔음
  - 한국어 전문검색(tsvector)은 형태소 분석기가 없어 어절 단위 완전일치가 되므로 쓰지 않았다 — 일지가 수천 건이 되면 그때 갈아탄다. 매칭 규칙은 `src/lib/logSearch.ts` 한 곳에 모여 있어 화면은 안 건드려도 된다
  - 검색어 하이라이트는 넣지 않았다. 일지 카드는 다른 화면에서도 쓰여서, 먼저 써 보고 필요하면 얹는다
```

- [ ] **Step 3: 커밋**

```bash
git add CHANGELOG.md
git commit -m "Record the journal search in the changelog

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: 사용자에게 보고**

- 무엇이 달라졌는지, 어떻게 쓰는지 한 문단
- **마이그레이션 없음** — Supabase에서 할 일이 없다고 명시
- **push는 하지 않았다**고 명시하고, 배포할지 물어본다 (`master` push = Vercel 자동 배포)

---

## 완료 기준

- `/journal` 검색창에 단어를 치고 엔터를 누르면 그 단어가 들어간 일지만 남는다
- 본문 아닌 칸(코멘트·결정사항·할 일·협의된 날짜 내용·안건 제목)에만 있는 단어로도 찾힌다
- 두 단어가 서로 다른 칸에 있어도 AND로 걸린다
- 검색어가 `?q=`로 주소에 남고, 필터 칩을 눌러도 유지되며 필터와 AND로 겹친다
- '해제'와 빈 값 제출이 검색어와 입력칸을 함께 비운다
- 0건일 때 검색어가 들어간 문구가 뜬다
- `npx tsc --noEmit` · `npm run lint` · `npm run build` 모두 통과
