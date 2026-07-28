import type { WorkLog } from "@/types/journal";

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
