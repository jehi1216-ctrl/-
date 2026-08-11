"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import ProjectChecklist from "./ProjectChecklist";
import {
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

// 폴더 하나(또는 폴더 없음 묶음)의 항목 목록. 어느 폴더를 볼지는 /checklist 페이지가
// ?group= 으로 정하고, 여기서는 완료 항목 토글과 폴더 이름 변경/삭제만 맡는다.
export default function ChecklistBoard({
  project,
  group,
  groups,
  items,
  contacts,
}: {
  project: Project;
  group: ChecklistGroup | null; // null이면 폴더 없음 묶음(또는 폴더를 안 쓰는 현장)
  groups: ChecklistGroup[];
  items: ChecklistItem[];
  contacts: ProjectContact[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showCompleted, setShowCompleted] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group?.name ?? "");

  const hiddenCount = items.filter((i) => i.status === "완료").length;
  const visible = showCompleted ? items : items.filter((i) => i.status !== "완료");

  function saveName() {
    if (!group) return;
    startTransition(async () => {
      await renameChecklistGroup(project.id, group.id, name);
      setRenaming(false);
    });
  }

  function handleDelete() {
    if (!group) return;
    if (
      !confirm(
        `'${group.name}' 폴더를 삭제할까요?\n안에 있는 항목 ${items.length}건은 지워지지 않고 '${NO_GROUP_LABEL}'으로 이동합니다.`
      )
    )
      return;
    startTransition(async () => {
      await deleteChecklistGroup(project.id, group.id);
    });
  }

  return (
    <div className={`space-y-4 ${isPending ? "opacity-50" : ""}`}>
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

      {group && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {renaming ? (
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
              <h2 className="min-w-0 break-words text-base font-semibold text-gray-900">
                📁 {group.name}
              </h2>
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
            </>
          )}
        </div>
      )}

      <ProjectChecklist
        projectId={project.id}
        items={visible}
        contacts={contacts}
        groups={groups}
        groupId={group?.id ?? null}
        title="체크리스트"
        groupByAssignee
      />
    </div>
  );
}
