// 프로젝트(현장)마다 고정된 색을 준다. DB에 색을 저장하지 않고 id로 결정하므로
// 어느 화면에서 보든 같은 현장은 항상 같은 색이다.
// 클래스 문자열은 Tailwind가 그대로 스캔할 수 있게 전체를 적어둔다(동적 조합 금지).
// chip = 배지 배경/글자, bar = 왼쪽 강조선. 순서를 바꾸면 기존 현장의 색이 바뀐다.
// bar는 `border-l-*`(왼쪽 전용)로 둔다 — `border-*`로 두면 같이 쓰는 테두리 색과
// 어느 쪽이 이길지 CSS 순서에 좌우된다.
const PROJECT_COLORS = [
  { chip: "bg-rose-100 text-rose-900", bar: "border-l-rose-400" },
  { chip: "bg-orange-100 text-orange-900", bar: "border-l-orange-400" },
  { chip: "bg-amber-100 text-amber-900", bar: "border-l-amber-400" },
  { chip: "bg-lime-100 text-lime-900", bar: "border-l-lime-400" },
  { chip: "bg-emerald-100 text-emerald-900", bar: "border-l-emerald-400" },
  { chip: "bg-teal-100 text-teal-900", bar: "border-l-teal-400" },
  { chip: "bg-sky-100 text-sky-900", bar: "border-l-sky-400" },
  { chip: "bg-indigo-100 text-indigo-900", bar: "border-l-indigo-400" },
  { chip: "bg-violet-100 text-violet-900", bar: "border-l-violet-400" },
  { chip: "bg-fuchsia-100 text-fuchsia-900", bar: "border-l-fuchsia-400" },
] as const;

function paletteIndex(projectId: string): number {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return hash % PROJECT_COLORS.length;
}

export function projectColorClass(projectId: string): string {
  return PROJECT_COLORS[paletteIndex(projectId)].chip;
}

export function projectBarClass(projectId: string): string {
  return PROJECT_COLORS[paletteIndex(projectId)].bar;
}
