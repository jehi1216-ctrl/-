import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKST, shiftMonth, buildMonthGrid, todayKST } from "@/lib/date";
import { projectColorClass } from "@/lib/projectColor";
import CalendarGrid, { type CalendarEntry } from "@/components/CalendarGrid";
import type { ScheduleItem } from "@/types/schedule";
import type { WorkLog } from "@/types/journal";
import type { Project } from "@/types/project";

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
      content: log.content,
      logDate: log.date,
    });
  }

  const [y, m] = month.split("-").map(Number);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">
            {y}년 {m}월
          </h1>
          <p className="text-sm text-gray-500">날짜를 누르면 그날 내용을 볼 수 있어요.</p>
        </div>
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

      <CalendarGrid
        weeks={weeks}
        entriesByDate={Object.fromEntries(itemsByDate)}
        today={todayKST()}
      />
    </div>
  );
}
