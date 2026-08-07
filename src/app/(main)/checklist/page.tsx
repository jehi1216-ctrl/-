import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChecklistBoard from "@/components/ChecklistBoard";
import { addChecklistGroup } from "@/app/(main)/projects/checklist-actions";
import {
  CHECKLIST_STATUS_OPTIONS,
  CHECKLIST_STATUS_BADGE_CLASS,
  PHASE_LABEL,
  PHASE_BADGE_CLASS,
  PHASES_BY_TYPE,
  NO_GROUP_LABEL,
  type Project,
  type ChecklistGroup,
  type ChecklistItem,
  type ChecklistStatus,
  type ProjectContact,
} from "@/types/project";
import { LOG_TYPE_LABEL, type LogType } from "@/types/journal";

// 폴더 없음 묶음을 가리키는 ?group= 값. 폴더 id(uuid)와 겹치지 않는다.
const UNGROUPED_PARAM = "none";

// 카드에 공통으로 들어가는 건수 요약.
function CountSummary({ items }: { items: ChecklistItem[] }) {
  const remaining = items.filter((i) => i.status !== "완료").length;
  const doneCount = items.length - remaining;
  const countByStatus = new Map<ChecklistStatus, number>();
  for (const item of items) {
    countByStatus.set(item.status, (countByStatus.get(item.status) ?? 0) + 1);
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-400">등록된 할 일이 없어요.</p>;
  }

  return (
    <>
      <p className="mb-2 text-sm text-gray-500">
        남은 <span className="font-semibold text-gray-900">{remaining}</span>건
        {doneCount > 0 && <span className="text-gray-400"> · 완료 {doneCount}건</span>}
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
  );
}

const CARD_CLASS =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/30";

function AddGroupForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={addChecklistGroup.bind(null, projectId)}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-gray-300 p-4 sm:flex-row"
    >
      <input
        name="name"
        required
        placeholder="새 폴더 이름 (예: 설계변경 보완사항)"
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
      >
        폴더 추가
      </button>
    </form>
  );
}

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; group?: string }>;
}) {
  const { project: requestedId, group: requestedGroup } = await searchParams;
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

  // 현장 목록 화면의 건수 요약에도 필요하므로 항목은 항상 전부 가져온다.
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

  // 협력업체(담당자 선택지)와 폴더는 펼친 현장에서만 쓴다.
  let contacts: ProjectContact[] = [];
  let groups: ChecklistGroup[] = [];
  if (activeProject) {
    const [{ data: contactRows }, { data: groupRows }] = await Promise.all([
      supabase
        .from("project_contacts")
        .select("*")
        .eq("user_id", user!.id)
        .eq("project_id", activeProject.id),
      supabase
        .from("project_checklist_groups")
        .select("*")
        .eq("user_id", user!.id)
        .eq("project_id", activeProject.id)
        .order("created_at", { ascending: true }),
    ]);
    contacts = (contactRows ?? []) as ProjectContact[];
    groups = (groupRows ?? []) as ChecklistGroup[];
  }

  if (projectList.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold">체크리스트</h1>
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

  // ── 현장 목록 ────────────────────────────────────────────────
  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">체크리스트</h1>
          <p className="text-sm text-gray-500">현장을 골라 할 일을 확인하세요.</p>
        </div>

        {(["design", "build"] as const).map((type: LogType) => {
          const group = projectList.filter((p) => PHASES_BY_TYPE[type].includes(p.phase));
          if (group.length === 0) return null;

          return (
            <section key={type}>
              <h2 className="mb-2 text-sm font-semibold text-gray-500">
                {LOG_TYPE_LABEL[type]}
                <span className="ml-1.5 font-normal text-gray-400">{group.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((p) => (
                  <Link key={p.id} href={`/checklist?project=${p.id}`} className={CARD_CLASS}>
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
                    <CountSummary items={itemsByProject.get(p.id) ?? []} />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  const projectItems = itemsByProject.get(activeProject.id) ?? [];
  const ungrouped = projectItems.filter((i) => !i.group_id);
  const activeGroup = groups.find((g) => g.id === requestedGroup) ?? null;
  const viewingUngrouped = requestedGroup === UNGROUPED_PARAM;
  // 폴더를 아직 하나도 안 만든 현장은 폴더 화면 없이 예전처럼 목록만 보여준다.
  const noFolders = groups.length === 0;

  // ── 폴더 안(또는 폴더를 안 쓰는 현장의 목록) ──────────────────
  if (activeGroup || viewingUngrouped || noFolders) {
    const scopedItems = activeGroup
      ? projectItems.filter((i) => i.group_id === activeGroup.id)
      : ungrouped;

    return (
      <div className="space-y-6">
        <div>
          <Link
            href={noFolders ? "/checklist" : `/checklist?project=${activeProject.id}`}
            className="text-sm text-gray-400 hover:text-brand-600"
          >
            ← {noFolders ? "현장 목록" : "폴더 목록"}
          </Link>
          <h1 className="mt-1 text-lg font-semibold">체크리스트</h1>
        </div>

        <ChecklistBoard
          project={activeProject}
          group={activeGroup}
          groups={groups}
          items={scopedItems}
          contacts={contacts}
        />

        {/* 폴더가 없는 현장에서는 여기가 첫 폴더를 만드는 유일한 자리다. */}
        {noFolders && <AddGroupForm projectId={activeProject.id} />}
      </div>
    );
  }

  // ── 폴더 목록 ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <Link href="/checklist" className="text-sm text-gray-400 hover:text-brand-600">
          ← 현장 목록
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{activeProject.name}</h1>
          <span
            className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PHASE_BADGE_CLASS[activeProject.phase]}`}
          >
            {PHASE_LABEL[activeProject.phase]}
          </span>
        </div>
        <p className="text-sm text-gray-500">폴더를 골라 할 일을 확인하세요.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/checklist?project=${activeProject.id}&group=${g.id}`}
            className={CARD_CLASS}
          >
            <p className="mb-2 min-w-0 break-words font-medium text-gray-900">
              📁 {g.name}
            </p>
            <CountSummary items={projectItems.filter((i) => i.group_id === g.id)} />
          </Link>
        ))}

        {ungrouped.length > 0 && (
          <Link
            href={`/checklist?project=${activeProject.id}&group=${UNGROUPED_PARAM}`}
            className={CARD_CLASS}
          >
            <p className="mb-2 font-medium text-gray-500">{NO_GROUP_LABEL}</p>
            <CountSummary items={ungrouped} />
          </Link>
        )}
      </div>

      <AddGroupForm projectId={activeProject.id} />
    </div>
  );
}
