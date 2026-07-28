import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayKST } from "@/lib/date";
import ProjectInfoCard from "@/components/ProjectInfoCard";
import ProgressNotes from "@/components/ProgressNotes";
import ProjectContacts from "@/components/ProjectContacts";
import ProjectFiles from "@/components/ProjectFiles";
import ProjectChecklist from "@/components/ProjectChecklist";
import ProjectJournalTabs from "@/components/ProjectJournalTabs";
import type { Project, ProjectContact, ProjectFile, ChecklistItem } from "@/types/project";
import type { WorkLog } from "@/types/journal";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: contacts } = await supabase
    .from("project_contacts")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", id)
    .is("work_log_id", null)
    .order("created_at", { ascending: false });

  const { data: checklistItems } = await supabase
    .from("project_checklist_items")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const { data: logs } = await supabase
    .from("work_logs")
    .select("*")
    .eq("project_id", id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const projectLogs = (logs ?? []) as WorkLog[];
  const designLogs = projectLogs.filter((l) => (l.log_type ?? "design") === "design");
  const buildLogs = projectLogs.filter((l) => l.log_type === "build");

  const logIds = projectLogs.map((l) => l.id);
  const filesByLog = new Map<string, ProjectFile[]>();
  if (logIds.length > 0) {
    const { data: logFiles } = await supabase
      .from("project_files")
      .select("*")
      .in("work_log_id", logIds);
    for (const f of (logFiles ?? []) as ProjectFile[]) {
      if (!f.work_log_id) continue;
      const bucket = filesByLog.get(f.work_log_id) ?? [];
      bucket.push(f);
      filesByLog.set(f.work_log_id, bucket);
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
      <ProjectChecklist
        projectId={p.id}
        items={(checklistItems ?? []) as ChecklistItem[]}
        contacts={(contacts ?? []) as ProjectContact[]}
      />

      <ProjectJournalTabs
        project={p}
        date={todayKST()}
        designLogs={designLogs}
        buildLogs={buildLogs}
        filesByLog={Object.fromEntries(filesByLog)}
        contacts={(contacts ?? []) as ProjectContact[]}
      />
    </div>
  );
}
