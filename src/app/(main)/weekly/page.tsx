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

// 할 일이 이번 주 화면의 어느 묶음에 들어가는지.
type Bucket = "overdue" | "week" | "undated";

const BUCKET_ORDER: Bucket[] = ["overdue", "week", "undated"];

const BUCKET_LABEL: Record<Bucket, string> = {
  overdue: "밀린 것",
  week: "이번 주",
  undated: "날짜 없음",
};

interface WeeklyItem {
  log: WorkLog;
  bucket: Bucket;
}

interface ProjectGroup {
  id: string;
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

  const [{ data: logs }, { data: projects }] = await Promise.all([
    supabase
      .from("work_logs")
      .select("*")
      .eq("user_id", user!.id)
      .eq("status", "todo"),
    supabase.from("projects").select("id, name").eq("user_id", user!.id),
  ]);

  const projectNames = new Map(
    ((projects ?? []) as Pick<Project, "id" | "name">[]).map((p) => [p.id, p.name])
  );

  const groups = new Map<string, ProjectGroup>();

  for (const log of (logs ?? []) as WorkLog[]) {
    if (!log.next_action) continue;

    const due = log.next_action_date;
    let bucket: Bucket;
    if (!due) {
      bucket = "undated";
    } else if (due < weekStart) {
      // 지나간 마감은 이번 주를 볼 때만 끌어온다. 미래 주에서는 과거 전부가
      // 딸려와 화면이 무의미해진다.
      if (!isCurrentWeek) continue;
      bucket = "overdue";
    } else if (due <= weekEnd) {
      bucket = "week";
    } else {
      continue; // 다음 주 이후
    }

    const group = groups.get(log.project_id) ?? {
      id: log.project_id,
      name: projectNames.get(log.project_id) ?? "알 수 없는 프로젝트",
      items: [],
      overdueCount: 0,
      earliestDate: null,
    };
    group.items.push({ log, bucket });
    if (bucket === "overdue") group.overdueCount += 1;
    if (due && (group.earliestDate === null || due < group.earliestDate)) {
      group.earliestDate = due;
    }
    groups.set(log.project_id, group);
  }

  // 급한 프로젝트가 위로: 밀린 게 있는 곳 → 마감이 이른 곳 → 이름 순.
  const groupList = [...groups.values()].sort((a, b) => {
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
      const ad = a.log.next_action_date ?? "";
      const bd = b.log.next_action_date ?? "";
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
              "일지에 남긴 할 일을 프로젝트별로 모아 봅니다."
            ) : (
              <>
                할 일 {totalCount}건
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
          이번 주에 잡힌 할 일이 없어요.
        </p>
      ) : (
        <div className="space-y-4">
          {groupList.map((group) => (
            <section
              key={group.id}
              className={`rounded-xl border border-gray-200 border-l-4 bg-white p-4 shadow-sm sm:p-6 ${projectBarClass(
                group.id
              )}`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/projects/${group.id}`}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${projectColorClass(
                    group.id
                  )}`}
                >
                  {group.name}
                </Link>
                <span className="text-xs text-gray-400">{group.items.length}건</span>
              </div>

              <ul className="space-y-2">
                {group.items.map(({ log, bucket }, index, all) => {
                  const badge = log.next_action_date
                    ? dueBadge(log.next_action_date, today)
                    : null;
                  // 묶음이 바뀌는 첫 줄에만 라벨을 붙여 목록을 짧게 유지한다.
                  const showLabel = index === 0 || all[index - 1].bucket !== bucket;

                  return (
                    <li key={log.id}>
                      {showLabel && (
                        <p
                          className={`mb-1 text-xs font-medium text-gray-400 ${
                            index === 0 ? "" : "mt-3"
                          }`}
                        >
                          {BUCKET_LABEL[bucket]}
                        </p>
                      )}
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            badge?.className ?? "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {!log.next_action_date
                            ? "미정"
                            : bucket === "overdue"
                              ? badge!.label
                              : `${weekdayOf(log.next_action_date)} ${formatShortDate(log.next_action_date)}`}
                        </span>
                        <span
                          className="min-w-0 break-words text-sm text-gray-800"
                          title={log.content}
                        >
                          {log.next_action}
                        </span>
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
