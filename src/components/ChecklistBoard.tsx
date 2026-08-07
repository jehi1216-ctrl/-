"use client";

import { useState } from "react";
import Link from "next/link";
import ProjectChecklist from "./ProjectChecklist";
import {
  PHASE_LABEL,
  PHASE_BADGE_CLASS,
  type Project,
  type ChecklistItem,
  type ProjectContact,
} from "@/types/project";

// 현장 하나의 체크리스트. 현장 고르기는 /checklist 페이지가 담당하고,
// 여기서는 완료 항목 보이기/숨기기 상태만 들고 있다.
export default function ChecklistBoard({
  project,
  items,
  contacts,
}: {
  project: Project;
  items: ChecklistItem[];
  contacts: ProjectContact[];
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  const visible = showCompleted ? items : items.filter((i) => i.status !== "완료");
  const hiddenCount = items.length - visible.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="font-medium hover:underline"
          >
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
          {showCompleted ? "완료 항목 숨기기" : `완료 항목 보기${hiddenCount > 0 ? ` (${hiddenCount})` : ""}`}
        </button>
      </div>

      {items.length > 0 && visible.length === 0 && !showCompleted && (
        <p className="text-sm text-gray-400">
          완료 항목 {hiddenCount}건만 있어요.{" "}
          <button
            type="button"
            onClick={() => setShowCompleted(true)}
            className="text-brand-600 underline"
          >
            보기
          </button>
        </p>
      )}

      <ProjectChecklist
        projectId={project.id}
        items={visible}
        contacts={contacts}
        title="할 일"
        groupByAssignee
      />
    </div>
  );
}
