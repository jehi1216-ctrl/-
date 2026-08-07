import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  todayKST,
  currentWeekKST,
  weekStartOf,
  weekEndOf,
  shiftWeek,
  formatWeekRange,
  formatShortDate,
  weekdayOf,
  dueBadge,
} from "@/lib/date";
import { projectColorClass, projectBarClass } from "@/lib/projectColor";
import type { WorkLog } from "@/types/journal";
import type { Project } from "@/types/project";
import type { ScheduleItem } from "@/types/schedule";

// 한 주 화면의 묶음. 날짜 없는 묶음(답변 대기/날짜 없음)과 밀린 것은
// 이번 주를 볼 때만 넣는다 — 다른 주에서는 매번 같은 더미가 따라와 의미가 없다.
type Bucket = "overdue" | "week" | "waiting" | "undated";

const BUCKET_ORDER: Bucket[] = ["overdue", "week", "waiting", "undated"];

const BUCKET_LABEL: Record<Bucket, string> = {
  overdue: "밀린 것",
  week: "이번 주",
  waiting: "답변 대기",
  undated: "날짜 없음",
};

const NO_PROJECT_KEY = "";

interface WeeklyItem {
  id: string;
  bucket: Bucket;
  label: string;
  date: string | null;
  isSchedule: boolean;
  hint?: string; // 마우스를 올렸을 때 보여줄 원본 기록 본문
  result?: string | null; // 일지에 적어둔 결과
}

interface ProjectGroup {
  id: string; // 빈 문자열이면 프로젝트 없는 일정 묶음
  name: string;
  items: WeeklyItem[];
  overdueCount: number;
  earliestDate: string | null;
}

export default async function WeeklyPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  // 주 중간 날짜가 들어와도 그 주의 월요일로 맞춰준다.
  const weekStart =
    weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)
      ? weekStartOf(weekParam)
      : currentWeekKST();
  const weekEnd = weekEndOf(weekStart);
  const today = todayKST();
  const isCurrentWeek = weekStart === currentWeekKST();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let scheduleQuery = supabase
    .from("schedule_items")
    .select("*")
    .eq("user_id", user!.id)
    .eq("is_done", false)
    .lte("date", weekEnd);
  // 이번 주가 아니면 지나간 일정을 끌어오지 않으므로 범위를 좁혀 받는다.
  if (!isCurrentWeek) scheduleQuery = scheduleQuery.gte("date", weekStart);

  const [{ data: logs }, { data: scheduleItems }, { data: projects }] =
    await Promise.all([
      supabase
        .from("work_logs")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", ["todo", "waiting"]),
      scheduleQuery,
      supabase.from("projects").select("id, name").eq("user_id", user!.id),
    ]);

  const projectNames = new Map(
    ((projects ?? []) as Pick<Project, "id" | "name">[]).map((p) => [p.id, p.name])
  );

  const groups = new Map<string, ProjectGroup>();

  function add(projectId: string | null, item: WeeklyItem) {
    const key = projectId ?? NO_PROJECT_KEY;
    const group = groups.get(key) ?? {
      id: key,
      name: key
        ? (projectNames.get(key) ?? "알 수 없는 프로젝트")
        : "프로젝트 없는 일정",
      items: [],
      overdueCount: 0,
      earliestDate: null,
    };
    group.items.push(item);
    if (item.bucket === "overdue") group.overdueCount += 1;
    if (item.date && (group.earliestDate === null || item.date < group.earliestDate)) {
      group.earliestDate = item.date;
    }
    groups.set(key, group);
  }

  // 날짜가 붙은 항목이 어느 묶음인지. 이 주와 무관하면 null을 돌려 걸러낸다.
  function datedBucket(date: string): Bucket | null {
    if (date < weekStart) return isCurrentWeek ? "overdue" : null;
    if (date <= weekEnd) return "week";
    return null; // 다음 주 이후
  }

  for (const log of (logs ?? []) as WorkLog[]) {
    // 배지를 눌러 상태만 바꾼 일지는 next_action이 비어 있다.
    // 미처리 모아보기와 똑같이 기록 본문으로 대신 보여준다.
    const label = (log.status === "todo" && log.next_action) || log.content;

    let bucket: Bucket | null;
    if (log.status === "waiting") {
      // 답변 대기에는 날짜 개념이 없다.
      bucket = isCurrentWeek ? "waiting" : null;
    } else if (!log.next_action_date) {
      bucket = isCurrentWeek ? "undated" : null;
    } else {
      bucket = datedBucket(log.next_action_date);
    }
    if (!bucket) continue;

    add(log.project_id, {
      id: log.id,
      bucket,
      label,
      date: bucket === "waiting" ? null : log.next_action_date,
      isSchedule: false,
      hint: log.content,
      result: log.result,
    });
  }

  for (const item of (scheduleItems ?? []) as ScheduleItem[]) {
    const bucket = datedBucket(item.date);
    if (!bucket) continue;

    add(item.project_id, {
      id: item.id,
      bucket,
      label: item.content,
      date: item.date,
      isSchedule: true,
    });
  }

  // 급한 프로젝트가 위로: 밀린 게 있는 곳 → 마감이 이른 곳 → 이름 순.
  // 프로젝트 없는 일정은 항상 맨 아래.
  const groupList = [...groups.values()].sort((a, b) => {
    if (!a.id !== !b.id) return a.id ? -1 : 1;
    if ((a.overdueCount > 0) !== (b.overdueCount > 0)) return a.overdueCount > 0 ? -1 : 1;
    if (a.earliestDate && b.earliestDate && a.earliestDate !== b.earliestDate) {
      return a.earliestDate < b.earliestDate ? -1 : 1;
    }
    if (a.earliestDate !== b.earliestDate) return a.earliestDate ? -1 : 1;
    return a.name.localeCompare(b.name, "ko");
  });

  for (const group of groupList) {
    group.items.sort((a, b) => {
      const order = BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket);
      if (order !== 0) return order;
      const ad = a.date ?? "";
      const bd = b.date ?? "";
      return ad < bd ? -1 : ad > bd ? 1 : 0;
    });
  }

  const totalCount = groupList.reduce((n, g) => n + g.items.length, 0);
  const overdueTotal = groupList.reduce((n, g) => n + g.overdueCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{formatWeekRange(weekStart)}</h1>
          <p className="text-sm text-gray-500">
            {totalCount === 0 ? (
              "일지의 할 일·답변 대기와 일정을 프로젝트별로 모아 봅니다."
            ) : (
              <>
                {totalCount}건
                {overdueTotal > 0 && (
                  <span className="font-medium text-red-600"> · 밀린 것 {overdueTotal}건</span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/weekly?week=${shiftWeek(weekStart, -1)}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            지난주
          </Link>
          <Link
            href="/weekly"
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            이번주
          </Link>
          <Link
            href={`/weekly?week=${shiftWeek(weekStart, 1)}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            다음주
          </Link>
        </div>
      </div>

      {groupList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          이번 주에 잡힌 일이 없어요.
        </p>
      ) : (
        <div className="space-y-4">
          {groupList.map((group) => (
            <section
              key={group.id || "none"}
              className={`rounded-xl border border-gray-200 border-l-4 bg-white p-4 shadow-sm sm:p-6 ${
                group.id ? projectBarClass(group.id) : "border-l-gray-300"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {group.id ? (
                  <Link
                    href={`/projects/${group.id}`}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${projectColorClass(
                      group.id
                    )}`}
                  >
                    {group.name}
                  </Link>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    {group.name}
                  </span>
                )}
                <span className="text-xs text-gray-400">{group.items.length}건</span>
              </div>

              <ul className="space-y-2">
                {group.items.map((item, index, all) => {
                  const badge = item.date ? dueBadge(item.date, today) : null;
                  // 묶음이 바뀌는 첫 줄에만 라벨을 붙여 목록을 짧게 유지한다.
                  const showLabel = index === 0 || all[index - 1].bucket !== item.bucket;

                  return (
                    <li key={`${item.isSchedule ? "s" : "l"}-${item.id}`}>
                      {showLabel && (
                        <p
                          className={`mb-1 text-xs font-medium text-gray-400 ${
                            index === 0 ? "" : "mt-3"
                          }`}
                        >
                          {BUCKET_LABEL[item.bucket]}
                        </p>
                      )}
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            badge?.className ?? "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {!item.date
                            ? "미정"
                            : item.bucket === "overdue"
                              ? badge!.label
                              : `${weekdayOf(item.date)} ${formatShortDate(item.date)}`}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="break-words text-sm text-gray-800">
                            {item.isSchedule && (
                              <span className="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 align-middle text-[11px] font-medium text-gray-500">
                                일정
                              </span>
                            )}
                            <span className="align-middle" title={item.hint}>
                              {item.label}
                            </span>
                          </span>
                          {item.result && (
                            // 답변 대기는 '지금 어디까지 와 있나'가 핵심이라 결과를
                            // 상태 색(보라)으로 눈에 띄게 띄운다.
                            <p
                              className={`mt-1 whitespace-pre-wrap break-words rounded-md px-2 py-1 text-xs ${
                                item.bucket === "waiting"
                                  ? "bg-violet-50 text-violet-900 ring-1 ring-violet-200"
                                  : "border-l-2 border-gray-200 pl-2 text-gray-500"
                              }`}
                            >
                              <span className="font-semibold">결과 </span>
                              {item.result}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
