import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonthKST,
  shiftMonth,
  buildMonthGrid,
  todayKST,
  formatTime,
  compareTimes,
} from "@/lib/date";
import { projectColorClass } from "@/lib/projectColor";
import CalendarGrid from "@/components/CalendarGrid";
import type { CalendarEntry } from "@/types/calendar";
import type { ScheduleItem } from "@/types/schedule";
import { parseDecisionDates, type WorkLog } from "@/types/journal";
import type { Project } from "@/types/project";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const { month: monthParam, date: dateParam } = await searchParams;
  // `?date=`로 들어오면 그 날이 든 달을 편다 — 달을 따로 맞춰 보내지 않아도 되게.
  const initialDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : (initialDate?.slice(0, 7) ?? currentMonthKST());

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weeks = buildMonthGrid(month);
  const rangeStart = weeks[0][0].date;
  const rangeEnd = weeks[weeks.length - 1][6].date;

  const [
    { data: scheduleItems },
    { data: todoLogs },
    { data: decisionLogs },
    { data: projects },
  ] = await Promise.all([
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
      // 종료된 일지라도 '그날로 협의됨'이 적혀 있으면 달력에 남아야 한다.
      // decision_dates는 jsonb라 날짜 범위로 자를 수가 없다. 값이 있는 것만 받아
      // 이 달에 걸리는 날짜를 아래에서 골라낸다.
      supabase
        .from("work_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "done")
        .not("decision_dates", "is", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
    ]);

  const projectList = (projects ?? []) as Pick<Project, "id" | "name">[];
  const projectNames = new Map(projectList.map((p) => [p.id, p.name]));

  const itemsByDate = new Map<string, CalendarEntry[]>();
  function push(date: string, entry: CalendarEntry) {
    const bucket = itemsByDate.get(date) ?? [];
    bucket.push(entry);
    itemsByDate.set(date, bucket);
  }

  // 색상 범례에는 이번 달에 실제로 항목이 있는 현장만 넣는다.
  const legend = new Map<string, string>();

  for (const item of (scheduleItems ?? []) as ScheduleItem[]) {
    const projectName = item.project_id
      ? (projectNames.get(item.project_id) ?? "알 수 없는 현장")
      : null;
    if (item.project_id && projectName) legend.set(item.project_id, projectName);
    push(item.date, {
      kind: "schedule",
      id: item.id,
      label: item.content,
      time: formatTime(item.start_time) || null,
      done: item.is_done,
      projectId: item.project_id,
      projectName,
    });
  }

  for (const log of (todoLogs ?? []) as WorkLog[]) {
    if (!log.next_action_date || !log.next_action) continue;
    const projectName = projectNames.get(log.project_id) ?? "알 수 없는 현장";
    legend.set(log.project_id, projectName);
    push(log.next_action_date, {
      kind: "todo",
      id: log.id,
      label: log.next_action,
      time: formatTime(log.next_action_time) || null,
      projectId: log.project_id,
      projectName,
      content: log.content,
      logDate: log.date,
    });
  }

  for (const log of (decisionLogs ?? []) as WorkLog[]) {
    const projectName = projectNames.get(log.project_id) ?? "알 수 없는 현장";
    // 한 일지가 여러 날에 협의됐을 수 있다. 날짜마다 한 칸씩 찍는다.
    for (const d of parseDecisionDates(log.decision_dates)) {
      if (d.date < rangeStart || d.date > rangeEnd) continue;
      legend.set(log.project_id, projectName);
      push(d.date, {
        kind: "decision",
        id: log.id,
        time: d.time || null,
        // 그날 내용을 안 적었으면 결정사항을, 그것도 없으면 기록 본문이라도 보여준다.
        label: d.content || log.decision || log.content,
        decision: log.decision,
        projectId: log.project_id,
        projectName,
        content: log.content,
        logDate: log.date,
      });
    }
  }

  // 한 칸 안에서는 시각이 이른 것부터. 시각 없는 항목은 '하루 종일'로 보고 뒤로 보낸다.
  for (const bucket of itemsByDate.values()) {
    bucket.sort((a, b) => compareTimes(a.time, b.time));
  }

  const [y, m] = month.split("-").map(Number);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">
            {y}년 {m}월
          </h1>
          <p className="text-sm text-gray-500">
            날짜를 누르면 그날 내용을 보고 바로 고칠 수 있어요.
          </p>
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
        projects={projectList}
        today={todayKST()}
        initialDate={initialDate}
      />
    </div>
  );
}
