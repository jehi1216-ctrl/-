"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import ProjectChecklist from "./ProjectChecklist";
import {
  addChecklistGroup,
  renameChecklistGroup,
  deleteChecklistGroup,
} from "@/app/(main)/projects/checklist-actions";
import {
  PHASE_LABEL,
  PHASE_BADGE_CLASS,
  NO_GROUP_LABEL,
  type Project,
  type ChecklistGroup,
  type ChecklistItem,
  type ProjectContact,
} from "@/types/project";

// 폴더 하나와 그 안의 항목들. 폴더 이름 수정/삭제는 여기서 한다.
function GroupSection({
  projectId,
  group,
  items,
  visibleItems,
  contacts,
  groups,
}: {
  projectId: string;
  group: ChecklistGroup | null; // null이면 '폴더 없음' 묶음
  items: ChecklistItem[];
  visibleItems: ChecklistItem[];
  contacts: ProjectContact[];
  groups: ChecklistGroup[];
}) {
  const [isPending, startTransition] = useTransition();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group?.name ?? "");

  const remaining = items.filter((i) => i.status !== "완료").length;

  function saveName() {
    if (!group) return;
    startTransition(async () => {
      await renameChecklistGroup(projectId, group.id, name);
      setRenaming(false);
    });
  }

  function handleDelete() {
    if (!group) return;
    if (
      !confirm(
        `'${group.name}' 폴더를 삭제할까요?\n안에 있는 할 일 ${items.length}건은 지워지지 않고 '${NO_GROUP_LABEL}'으로 이동합니다.`
      )
    )
      return;
    startTransition(async () => {
      await deleteChecklistGroup(projectId, group.id);
    });
  }

  return (
    <section className={isPending ? "opacity-50" : ""}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {renaming && group ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={saveName}
              disabled={isPending || !name.trim()}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setName(group.name);
                setRenaming(false);
              }}
              className="text-xs text-gray-500 hover:underline"
            >
              취소
            </button>
          </div>
        ) : (
          <>
            <h3 className="flex min-w-0 items-center gap-2">
              <span className="break-words font-semibold text-gray-800">
                {group ? group.name : NO_GROUP_LABEL}
              </span>
              <span className="flex-shrink-0 text-xs text-gray-400">
                남은 {remaining} / 전체 {items.length}
              </span>
            </h3>
            {group && (
              <div className="flex flex-shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  disabled={isPending}
                  className="text-xs text-gray-400 hover:text-brand-600"
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  폴더 삭제
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ProjectChecklist
        projectId={projectId}
        items={visibleItems}
        contacts={contacts}
        groups={groups}
        groupId={group?.id ?? null}
        title="할 일"
        groupByAssignee
      />
    </section>
  );
}

// 현장 하나의 체크리스트. 현장 고르기는 /checklist 페이지가 담당하고,
// 여기서는 완료 항목 보이기/숨기기와 폴더 관리를 맡는다.
export default function ChecklistBoard({
  project,
  groups,
  items,
  contacts,
}: {
  project: Project;
  groups: ChecklistGroup[];
  items: ChecklistItem[];
  contacts: ProjectContact[];
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  const hiddenCount = items.filter((i) => i.status === "완료").length;
  const inGroup = (groupId: string | null) =>
    items.filter((i) => (i.group_id ?? null) === groupId);
  const visible = (list: ChecklistItem[]) =>
    showCompleted ? list : list.filter((i) => i.status !== "완료");

  const ungrouped = inGroup(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
            {project.name}
          </Link>
          <span
            className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PHASE_BADGE_CLASS[project.phase]}`}
          >
            {PHASE_LABEL[project.phase]}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          {showCompleted
            ? "완료 항목 숨기기"
            : `완료 항목 보기${hiddenCount > 0 ? ` (${hiddenCount})` : ""}`}
        </button>
      </div>

      {groups.map((g) => {
        const groupItems = inGroup(g.id);
        return (
          <GroupSection
            key={g.id}
            projectId={project.id}
            group={g}
            items={groupItems}
            visibleItems={visible(groupItems)}
            contacts={contacts}
            groups={groups}
          />
        );
      })}

      {/* 폴더가 하나도 없으면 '폴더 없음' 제목 없이 그냥 목록만 보이는 게 자연스럽다. */}
      {(ungrouped.length > 0 || groups.length === 0) &&
        (groups.length === 0 ? (
          <ProjectChecklist
            projectId={project.id}
            items={visible(ungrouped)}
            contacts={contacts}
            groups={groups}
            title="할 일"
            groupByAssignee
          />
        ) : (
          <GroupSection
            projectId={project.id}
            group={null}
            items={ungrouped}
            visibleItems={visible(ungrouped)}
            contacts={contacts}
            groups={groups}
          />
        ))}

      <form
        action={addChecklistGroup.bind(null, project.id)}
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
    </div>
  );
}
