import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Project, ChecklistItem } from "@/types/project";
import ProjectListTabs from "@/components/ProjectListTabs";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (projects ?? []) as Project[];

  const { data: checklistItems } = await supabase
    .from("project_checklist_items")
    .select("*")
    .eq("user_id", user!.id)
    .neq("status", "완료");

  const checklistsByProject = new Map<string, ChecklistItem[]>();
  for (const item of (checklistItems ?? []) as ChecklistItem[]) {
    const bucket = checklistsByProject.get(item.project_id) ?? [];
    bucket.push(item);
    checklistsByProject.set(item.project_id, bucket);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">프로젝트(현장)</h1>
          <p className="text-sm text-gray-500">진행 중인 현장을 관리하세요.</p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          새 프로젝트
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          등록된 프로젝트가 없어요.
        </p>
      ) : (
        <ProjectListTabs
          projects={list}
          checklistsByProject={Object.fromEntries(checklistsByProject)}
        />
      )}
    </div>
  );
}
