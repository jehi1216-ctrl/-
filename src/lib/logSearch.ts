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
