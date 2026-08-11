const TIME_ZONE = "Asia/Seoul";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  return `${kst.getFullYear()}-${pad(kst.getMonth() + 1)}-${pad(kst.getDate())}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${y}년 ${m}월 ${d}일 (${WEEKDAYS[date.getUTCDay()]})`;
}

// from → to 사이의 일수. 미래면 양수, 과거면 음수.
export function diffDays(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000
  );
}

export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}/${d}`;
}

// ── 주 단위 (월요일 시작) ────────────────────────────────────
// 주는 항상 시작일(월요일) 날짜 문자열로 나타낸다.

function shiftDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + delta));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function weekStartOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  // getUTCDay(): 0=일 … 6=토. 월요일부터 며칠 지났는지로 바꾼다.
  const offset = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return shiftDays(dateStr, -offset);
}

export function currentWeekKST(): string {
  return weekStartOf(todayKST());
}

export function shiftWeek(weekStart: string, delta: number): string {
  return shiftDays(weekStart, delta * 7);
}

export function weekEndOf(weekStart: string): string {
  return shiftDays(weekStart, 6);
}

export function formatWeekRange(weekStart: string): string {
  const [sy, sm, sd] = weekStart.split("-").map(Number);
  const [ey, em, ed] = weekEndOf(weekStart).split("-").map(Number);
  const end = sy === ey ? `${em}월 ${ed}일` : `${ey}년 ${em}월 ${ed}일`;
  return `${sy}년 ${sm}월 ${sd}일 ~ ${end}`;
}

export function weekdayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// 마감일이 얼마나 급한지를 배지 문구/색으로 바꾼다. 미처리 모아보기와 주간 업무가
// 같은 규칙을 쓰도록 여기 한 곳에만 둔다.
export function dueBadge(dueDate: string, today: string) {
  const days = diffDays(today, dueDate);
  if (days < 0) return { label: `${-days}일 지남`, className: "bg-red-100 text-red-700" };
  if (days === 0) return { label: "오늘", className: "bg-red-100 text-red-700" };
  if (days <= 7) return { label: `D-${days}`, className: "bg-amber-100 text-amber-700" };
  return { label: formatShortDate(dueDate), className: "bg-gray-100 text-gray-500" };
}

export function currentMonthKST(): string {
  const today = todayKST();
  return today.slice(0, 7);
}

export function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function toDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export interface CalendarCell {
  date: string;
  inMonth: boolean;
}

export function buildMonthGrid(yearMonth: string): CalendarCell[][] {
  const [y, m] = yearMonth.split("-").map(Number);
  const startWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const cells: CalendarCell[] = [];

  for (let i = startWeekday; i > 0; i--) {
    cells.push({ date: toDateStr(new Date(Date.UTC(y, m - 1, 1 - i))), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toDateStr(new Date(Date.UTC(y, m - 1, d))), inMonth: true });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: toDateStr(new Date(Date.UTC(y, m, trailing))), inMonth: false });
    trailing += 1;
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// DB의 time 컬럼은 "HH:MM:SS"로 오고 <input type="time">은 "HH:MM"을 준다.
// 화면과 입력값을 한 모양(HH:MM)으로 맞춘다.
export function formatTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "";
}

// 같은 날 안에서의 정렬. 시간이 없는 항목은 '하루 종일'로 보고 뒤로 보낸다.
export function compareTimes(
  a: string | null | undefined,
  b: string | null | undefined
): number {
  const at = formatTime(a);
  const bt = formatTime(b);
  if (at && bt) return at < bt ? -1 : at > bt ? 1 : 0;
  if (at) return -1;
  if (bt) return 1;
  return 0;
}
