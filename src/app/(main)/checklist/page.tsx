import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChecklistBoard from "@/components/ChecklistBoard";
import {
  CHECKLIST_STATUS_OPTIONS,
  CHECKLIST_STATUS_BADGE_CLASS,
  PHASE_LABEL,
  PHASE_BADGE_CLASS,
  type Project,
  type ChecklistItem,
  type ChecklistStatus,
  type ProjectContact,
} from "@/types/project";

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: requestedId } = await searchParams;
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
  // 없는 id가 들어오면 현장 목록으로 돌아간다.
  const activeProject = projectList.find((p) => p.id === requestedId) ?? null;

  // 목록 화면의 현장별 건수 요약에도 필요하므로 항목은 항상 전부 가져온다.
  const { data: checklistItems } = await supabase
    .from("project_checklist_items")
    .select("*")
    .eq("user_id", user!.id);

  const itemsByProject = new Map<string, ChecklistItem[]>();
  for (const item of (checklistItems ?? []) as ChecklistItem[]) {
    const bucket = itemsByProject.get(item.project_id) ?? [];
    bucket.push(item);
    itemsByProject.set(item.project_id, bucket);
  }

  // 협력업체(담당자 선택지)는 펼친 현장에서만 쓴다.
  let contacts: ProjectContact[] = [];
  if (activeProject) {
    const { data } = await supabase
      .from("project_contacts")
      .select("*")
      .eq("user_id", user!.id)
      .eq("project_id", activeProject.id);
    contacts = (data ?? []) as ProjectContact[];
  }

  if (projectList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">체크리스트</h1>
        </div>
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          체크리스트를 등록하려면 먼저{" "}
          <Link href="/projects/new" className="font-medium text-brand-600 hover:underline">
            프로젝트를 등록
          </Link>
          해주세요.
        </p>
      </div>
    );
  }

  if (activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/checklist"
            className="text-sm text-gray-400 hover:text-brand-600"
          >
            ← 현장 목록
          </Link>
          <h1 className="mt-1 text-lg font-semibold">체크리스트</h1>
        </div>

        <ChecklistBoard
          project={activeProject}
          items={itemsByProject.get(activeProject.id) ?? []}
          contacts={contacts}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">체크리스트</h1>
        <p className="text-sm text-gray-500">현장을 골라 할 일을 확인하세요.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projectList.map((p) => {
          const items = itemsByProject.get(p.id) ?? [];
          const remaining = items.filter((i) => i.status !== "완료").length;
          const doneCount = items.length - remaining;
          const countByStatus = new Map<ChecklistStatus, number>();
          for (const item of items) {
            countByStatus.set(item.status, (countByStatus.get(item.status) ?? 0) + 1);
          }

          return (
            <Link
              key={p.id}
              href={`/checklist?project=${p.id}`}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="min-w-0 break-words font-medium text-gray-900">
                  {p.name}
                </span>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PHASE_BADGE_CLASS[p.phase]}`}
                >
                  {PHASE_LABEL[p.phase]}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 할 일이 없어요.</p>
              ) : (
                <>
                  <p className="mb-2 text-sm text-gray-500">
                    남은 <span className="font-semibold text-gray-900">{remaining}</span>건
                    {doneCount > 0 && (
                      <span className="text-gray-400"> · 완료 {doneCount}건</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {CHECKLIST_STATUS_OPTIONS.filter((s) => s !== "완료").map((s) => {
                      const n = countByStatus.get(s) ?? 0;
                      if (n === 0) return null;
                      return (
                        <span
                          key={s}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${CHECKLIST_STATUS_BADGE_CLASS[s]}`}
                        >
                          {s} {n}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
