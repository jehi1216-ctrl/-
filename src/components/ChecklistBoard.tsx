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

export default function ChecklistBoard({
  projects,
  checklistsByProject,
  contactsByProject,
}: {
  projects: Project[];
  checklistsByProject: Record<string, ChecklistItem[]>;
  contactsByProject: Record<string, ProjectContact[]>;
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          {showCompleted ? "완료 항목 숨기기" : "완료 항목 보기"}
        </button>
      </div>

      <div className="space-y-6">
        {projects.map((p) => {
          const all = checklistsByProject[p.id] ?? [];
          const visible = showCompleted
            ? all
            : all.filter((item) => item.status !== "완료");
          const hiddenCount = all.length - visible.length;

          return (
            <section key={p.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                  {p.name}
                </Link>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PHASE_BADGE_CLASS[p.phase]}`}
                >
                  {PHASE_LABEL[p.phase]}
                </span>
              </div>

              {all.length > 0 && visible.length === 0 && !showCompleted && (
                <p className="mb-2 text-sm text-gray-400">
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
                projectId={p.id}
                items={visible}
                contacts={contactsByProject[p.id] ?? []}
                title={p.name}
                groupByAssignee
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
