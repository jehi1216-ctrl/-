import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayKST, formatDateLabel } from "@/lib/date";
import TodayEntry from "@/components/TodayEntry";
import JournalEntryCard from "@/components/JournalEntryCard";
import ScheduleSection from "@/components/ScheduleSection";
import OpenLogsSection from "@/components/OpenLogsSection";
import { compareOpenLogs, type WorkLog } from "@/types/journal";
import type { Project, ProjectFile, ChecklistItem, ProjectContact } from "@/types/project";
import type { ScheduleItem } from "@/types/schedule";

export default async function DashboardPage() {
  const supabase = await createClient();
  const date = todayKST();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const projectList = (projects ?? []) as Project[];
  const projectNameById = new Map(projectList.map((p) => [p.id, p.name]));

  const { data: checklistItems } = await supabase
    .from("project_checklist_items")
    .select("*")
    .eq("user_id", user!.id);

  const checklistsByProject = new Map<string, ChecklistItem[]>();
  for (const item of (checklistItems ?? []) as ChecklistItem[]) {
    const bucket = checklistsByProject.get(item.project_id) ?? [];
    bucket.push(item);
    checklistsByProject.set(item.project_id, bucket);
  }

  const { data: contactRows } = await supabase
    .from("project_contacts")
    .select("*")
    .eq("user_id", user!.id);

  const contactsByProject = new Map<string, ProjectContact[]>();
  for (const c of (contactRows ?? []) as ProjectContact[]) {
    const bucket = contactsByProject.get(c.project_id) ?? [];
    bucket.push(c);
    contactsByProject.set(c.project_id, bucket);
  }

  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", date)
    .order("created_at", { ascending: true });

  const { data: logs } = await supabase
    .from("work_logs")
    .select("*")
    .eq("user_id", user!.id)
    .eq("date", date)
    .order("created_at", { ascending: false });

  const todayLogs = (logs ?? []) as WorkLog[];

  // 날짜와 무관하게 아직 끝나지 않은 일지를 모두 모은다(마감일 빠른 순, 없으면 뒤로).
  const { data: openLogRows } = await supabase
    .from("work_logs")
    .select("*")
    .eq("user_id", user!.id)
    .in("status", ["todo", "waiting"])
    .order("date", { ascending: false });

  const openLogs = ((openLogRows ?? []) as WorkLog[]).sort(compareOpenLogs);

  const logIds = todayLogs.map((l) => l.id);
  const filesByLog = new Map<string, ProjectFile[]>();
  if (logIds.length > 0) {
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .in("work_log_id", logIds);
    for (const f of (files ?? []) as ProjectFile[]) {
      if (!f.work_log_id) continue;
      const bucket = filesByLog.get(f.work_log_id) ?? [];
      bucket.push(f);
      filesByLog.set(f.work_log_id, bucket);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{formatDateLabel(date)}</h1>
        <p className="text-sm text-gray-500">오늘 한 업무를 기록하세요.</p>
      </div>

      <OpenLogsSection
        logs={openLogs}
        projectNames={Object.fromEntries(projectNameById)}
        today={date}
      />

      <ScheduleSection date={date} items={(scheduleItems ?? []) as ScheduleItem[]} />

      {projectList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          업무를 기록하려면 먼저{" "}
          <Link href="/projects/new" className="font-medium text-brand-600 hover:underline">
            프로젝트를 등록
          </Link>
          해주세요.
        </p>
      ) : (
        <TodayEntry
          date={date}
          projects={projectList}
          checklistsByProject={Object.fromEntries(checklistsByProject)}
          contactsByProject={Object.fromEntries(contactsByProject)}
        />
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">
          오늘 작성한 기록 ({todayLogs.length})
        </h2>
        {todayLogs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            아직 작성한 건축일지가 없어요.
          </p>
        ) : (
          <ul className="space-y-3">
            {todayLogs.map((log) => (
              <JournalEntryCard
                key={log.id}
                log={log}
                projectName={projectNameById.get(log.project_id)}
                files={filesByLog.get(log.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
