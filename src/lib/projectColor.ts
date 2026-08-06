// 프로젝트(현장)마다 고정된 색을 준다. DB에 색을 저장하지 않고 id로 결정하므로
// 어느 화면에서 보든 같은 현장은 항상 같은 색이다.
// 클래스 문자열은 Tailwind가 그대로 스캔할 수 있게 전체를 적어둔다(동적 조합 금지).
const PROJECT_COLOR_CLASSES = [
  "bg-rose-100 text-rose-900",
  "bg-orange-100 text-orange-900",
  "bg-amber-100 text-amber-900",
  "bg-lime-100 text-lime-900",
  "bg-emerald-100 text-emerald-900",
  "bg-teal-100 text-teal-900",
  "bg-sky-100 text-sky-900",
  "bg-indigo-100 text-indigo-900",
  "bg-violet-100 text-violet-900",
  "bg-fuchsia-100 text-fuchsia-900",
] as const;

export function projectColorClass(projectId: string): string {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return PROJECT_COLOR_CLASSES[hash % PROJECT_COLOR_CLASSES.length];
}
