import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKST, shiftMonth, buildMonthGrid, todayKST } from "@/lib/date";
import { projectColorClass } from "@/lib/projectColor";
import type { ScheduleItem } from "@/types/schedule";
import type { WorkLog } from "@/types/journal";
import type { Project } from "@/types/project";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 캘린더 한 칸에 들어가는 항목. 일정(schedule_items)과 일지의 '내가 할 일'을 함께 보여준다.
type CalendarEntry =
  | { kind: "schedule"; id: string; label: string; done: boolean }
  | {
      kind: "todo";
      id: string;
      label: string;
      projectId: string;
      projectName: string;
    };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonthKST();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weeks = buildMonthGrid(month);
  const rangeStart = weeks[0][0].date;
  const rangeEnd = weeks[weeks.length - 1][6].date;

  const [{ data: scheduleItems }, { data: todoLogs }, { data: projects }] =
    await Promise.all([
      supabase
        .from("schedule_items")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", rangeStart)
        .lte("date", rangeEnd)
        .order("created_at", { ascending: true }),
      supabase
        .from("work_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "todo")
        .gte("next_action_date", rangeStart)
        .lte("next_action_date", rangeEnd)
        .order("created_at", { ascending: true }),
      supabase.from("projects").select("id, name").eq("user_id", user!.id),
    ]);

  const projectNames = new Map(
    ((projects ?? []) as Pick<Project, "id" | "name">[]).map((p) => [p.id, p.name])
  );

  const itemsByDate = new Map<string, CalendarEntry[]>();
  function push(date: string, entry: CalendarEntry) {
    const bucket = itemsByDate.get(date) ?? [];
    bucket.push(entry);
    itemsByDate.set(date, bucket);
  }

  for (const item of (scheduleItems ?? []) as ScheduleItem[]) {
    push(item.date, {
      kind: "schedule",
      id: item.id,
      label: item.content,
      done: item.is_done,
    });
  }

  // 색상 범례에는 이번 달에 실제로 할 일이 있는 현장만 넣는다.
  const legend = new Map<string, string>();
  for (const log of (todoLogs ?? []) as WorkLog[]) {
    if (!log.next_action_date || !log.next_action) continue;
    const projectName = projectNames.get(log.project_id) ?? "알 수 없는 현장";
    legend.set(log.project_id, projectName);
    push(log.next_action_date, {
      kind: "todo",
      id: log.id,
      label: log.next_action,
      projectId: log.project_id,
      projectName,
    });
  }

  const [y, m] = month.split("-").map(Number);
  const today = todayKST();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          {y}년 {m}월
        </h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?month=${shiftMonth(month, -1)}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            이전
          </Link>
          <Link
            href={`/calendar?month=${currentMonthKST()}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            오늘
          </Link>
          <Link
            href={`/calendar?month=${shiftMonth(month, 1)}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            다음
          </Link>
        </div>
      </div>

      {legend.size > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {[...legend].map(([id, name]) => (
            <Link
              key={id}
              href={`/projects/${id}`}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${projectColorClass(id)}`}
            >
              {name}
            </Link>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[640px] rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-medium text-gray-400">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 border-b border-gray-100 last:border-b-0"
            >
              {week.map((cell) => {
                const dayItems = itemsByDate.get(cell.date) ?? [];
                const dayNum = Number(cell.date.slice(8, 10));
                const isToday = cell.date === today;
                return (
                  <div
                    key={cell.date}
                    className={`flex min-h-[96px] flex-col gap-1 border-r border-gray-100 p-1.5 text-left last:border-r-0 ${
                      cell.inMonth ? "" : "bg-gray-50/50"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 font-semibold text-white"
                          : cell.inMonth
                            ? "text-gray-500"
                            : "text-gray-300"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayItems.slice(0, 3).map((item) =>
                        item.kind === "todo" ? (
                          <Link
                            key={item.id}
                            href={`/projects/${item.projectId}`}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${projectColorClass(
                              item.projectId
                            )}`}
                            title={`[${item.projectName}] ${item.label}`}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <span
                            key={item.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] ${
                              item.done
                                ? "bg-gray-100 text-gray-400 line-through"
                                : "bg-brand-50 text-brand-700"
                            }`}
                            title={item.label}
                          >
                            {item.label}
                          </span>
                        )
                      )}
                      {dayItems.length > 3 && (
                        <span className="text-[10px] text-gray-400">
                          +{dayItems.length - 3}건 더
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
