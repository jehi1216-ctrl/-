import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMonthGrid, currentMonthKST, todayKST } from "@/lib/date";
import ProjectInfoCard from "@/components/ProjectInfoCard";
import ProgressNotes from "@/components/ProgressNotes";
import ProjectContacts from "@/components/ProjectContacts";
import ProjectFiles from "@/components/ProjectFiles";
import ProjectCalendar from "@/components/ProjectCalendar";
import type { Project, ProjectContact, ProjectFile } from "@/types/project";
import type { JournalStatus, WorkLog } from "@/types/journal";
import type { ScheduleItem } from "@/types/schedule";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonthKST();

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const p = project as Project;

  // 그리드는 앞뒤 달을 조금 물고 있으므로, 조회 범위도 첫 칸~마지막 칸으로 맞춘다.
  const weeks = buildMonthGrid(month);
  const rangeStart = weeks[0][0].date;
  const rangeEnd = weeks[weeks.length - 1][6].date;

  const [
    { data: contacts },
    { data: files },
    { data: monthLogs },
    { data: monthTodos },
    { data: monthSchedules },
    { data: logDates },
  ] = await Promise.all([
    supabase
      .from("project_contacts")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("project_files")
      .select("*")
      .eq("project_id", id)
      .is("work_log_id", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("work_logs")
      .select("*")
      .eq("project_id", id)
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("created_at", { ascending: true }),
    supabase
      .from("work_logs")
      .select("*")
      .eq("project_id", id)
      .eq("status", "todo")
      .gte("next_action_date", rangeStart)
      .lte("next_action_date", rangeEnd)
      .order("created_at", { ascending: true }),
    supabase
      .from("schedule_items")
      .select("*")
      .eq("project_id", id)
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("created_at", { ascending: true }),
    // 기록이 전부 다른 달에 있으면 빈 달력만 남는다. 어느 달을 봐야 하는지 알려주려고
    // 두 칸만 전부 읽어 처음/최근 달, 전체 건수, 열려 있는 답변 대기 건수를 한 번에 구한다.
    supabase
      .from("work_logs")
      .select("date, status")
      .eq("project_id", id)
      .order("date", { ascending: true }),
  ]);

  const logs = (monthLogs ?? []) as WorkLog[];
  const todos = (monthTodos ?? []) as WorkLog[];
  const schedules = (monthSchedules ?? []) as ScheduleItem[];
  const allLogDates = (logDates ?? []) as { date: string; status: JournalStatus }[];
  const waitingCount = allLogDates.filter((l) => l.status === "waiting").length;

  const logIds = [...new Set([...logs, ...todos].map((l) => l.id))];
  const filesByLog: Record<string, ProjectFile[]> = {};
  if (logIds.length > 0) {
    const { data: logFiles } = await supabase
      .from("project_files")
      .select("*")
      .in("work_log_id", logIds);
    for (const f of (logFiles ?? []) as ProjectFile[]) {
      if (!f.work_log_id) continue;
      (filesByLog[f.work_log_id] ??= []).push(f);
    }
  }

  return (
    <div className="space-y-6">
      <ProjectInfoCard project={p} />
      <ProgressNotes projectId={p.id} notes={p.progress_notes} />
      <ProjectContacts projectId={p.id} contacts={(contacts ?? []) as ProjectContact[]} />
      <ProjectFiles
        projectId={p.id}
        files={(files ?? []) as ProjectFile[]}
        title="문서함 (도면, 계약서 등)"
      />
      <ProjectCalendar
        projectId={p.id}
        projectName={p.name}
        month={month}
        weeks={weeks}
        today={todayKST()}
        logs={logs}
        todos={todos}
        schedules={schedules}
        filesByLog={filesByLog}
        totalLogs={allLogDates.length}
        waitingCount={waitingCount}
        firstLogMonth={allLogDates[0]?.date.slice(0, 7) ?? null}
        lastLogMonth={allLogDates[allLogDates.length - 1]?.date.slice(0, 7) ?? null}
      />
    </div>
  );
}
