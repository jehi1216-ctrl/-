import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChecklistBoard from "@/components/ChecklistBoard";
import type { Project, ChecklistItem, ProjectContact } from "@/types/project";

export default async function ChecklistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const projectList = (projects ?? []) as Project[];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">체크리스트</h1>
        <p className="text-sm text-gray-500">현장별 할 일을 한눈에 확인하세요.</p>
      </div>

      {projectList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          체크리스트를 등록하려면 먼저{" "}
          <Link href="/projects/new" className="font-medium text-brand-600 hover:underline">
            프로젝트를 등록
          </Link>
          해주세요.
        </p>
      ) : (
        <ChecklistBoard
          projects={projectList}
          checklistsByProject={Object.fromEntries(checklistsByProject)}
          contactsByProject={Object.fromEntries(contactsByProject)}
        />
      )}
    </div>
  );
}
