import { NUMBERED_CATEGORIES, type WorkLog } from "@/types/journal";

// 달력 칸처럼 한 줄만 들어가는 자리에 쓸 이름. 본문 첫 줄은 칸에서 잘려 나와
// (`교장선생님 의견 1. TF팀 꾸려서…`) 무슨 건인지 알 수 없으므로 본문은 쓰지 않는다.
// 번호를 매긴 안건이면 `협의-02: 제목` — 이때 세부 태그(발주처 등)는 제목에 자리를
// 내주고 뺀다. 번호가 여럿 붙은 드문 경우엔 NUMBERED_CATEGORIES 순서로 첫 번째.
// 그 밖의 기록은 배지와 똑같은 문구(`검토(법적근거) · 설계(CAD)`)를 한 줄로 세운다.
// 전문은 날짜를 눌러 펼치는 패널에서 본다.
export function logChipLabel(log: WorkLog): string {
  // 카테고리는 저장할 때 하나 이상을 받지만, 옛 기록이 비어 있으면 본문으로 물러난다.
  return numberedLabel(log) ?? (categoryBadges(log).join(" · ") || log.content);
}

// 회차가 붙은 굵직한 안건이면 `협의-02: 제목`, 아니면 null.
function numberedLabel(log: WorkLog): string | null {
  const d = log.category_details ?? {};
  for (const cat of NUMBERED_CATEGORIES) {
    const entry = d[cat];
    if (log.categories.includes(cat) && entry) {
      return `${cat}-${String(entry.seq).padStart(2, "0")}: ${entry.title}`;
    }
  }
  return null;
}

// 달력에서 안건에만 다른 색을 주기 위해 쓴다. 판정 기준이 칩 문구와 갈라지면
// 색과 글이 어긋나므로 logChipLabel과 같은 numberedLabel을 본다.
export function isNumberedAgenda(log: WorkLog): boolean {
  return numberedLabel(log) !== null;
}

export function categoryBadges(log: WorkLog): string[] {
  if (log.log_type === "build") {
    return [...log.categories];
  }

  const d = log.category_details ?? {};
  const badges: string[] = [];

  if (log.categories.includes("검토")) {
    const subs = d.검토 ?? [];
    badges.push(subs.length ? `검토(${subs.join(", ")})` : "검토");
  }
  if (log.categories.includes("설계")) {
    const subs = d.설계 ?? [];
    badges.push(subs.length ? `설계(${subs.join(", ")})` : "설계");
  }
  if (log.categories.includes("대관")) {
    const subs = d.대관 ?? [];
    badges.push(subs.length ? `대관(${subs.join(", ")})` : "대관");
  }

  if (log.categories.includes("협의")) {
    const subs = d.협의_sub ?? [];
    const subPart = subs.length ? `(${subs.join(", ")})` : "";
    const entry = d.협의;
    badges.push(
      entry
        ? `협의${subPart}-${String(entry.seq).padStart(2, "0")}: ${entry.title}`
        : `협의${subPart}`
    );
  }

  for (const key of ["PT", "브랜딩"] as const) {
    if (log.categories.includes(key)) {
      const entry = d[key];
      badges.push(
        entry
          ? `${key}-${String(entry.seq).padStart(2, "0")}: ${entry.title}`
          : key
      );
    }
  }

  return badges;
}
