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
