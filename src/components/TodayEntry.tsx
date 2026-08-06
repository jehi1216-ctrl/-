"use client";

import { useState } from "react";
import JournalForm from "./JournalForm";
import {
  PHASE_LABEL,
  PHASE_BADGE_CLASS,
  type Project,
  type ProjectPhase,
  type ChecklistItem,
  type ProjectContact,
} from "@/types/project";
import { LOG_TYPE_LABEL, type LogType } from "@/types/journal";

const PHASES_BY_TYPE: Record<LogType, ProjectPhase[]> = {
  design: ["design", "permit"],
  build: ["construction", "completed"],
};

export default function TodayEntry({
  date,
  projects,
  checklistsByProject,
  contactsByProject,
}: {
  date: string;
  projects: Project[];
  checklistsByProject: Record<string, ChecklistItem[]>;
  contactsByProject: Record<string, ProjectContact[]>;
}) {
  const [tab, setTab] = useState<LogType>("design");
  const [selected, setSelected] = useState<Project | null>(null);

  if (selected) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="text-sm text-gray-500 hover:text-brand-600"
        >
          ← 다른 현장 선택
        </button>
        <JournalForm
          date={date}
          projectId={selected.id}
          checklistsByProject={checklistsByProject}
          contactsByProject={contactsByProject}
          lockedLogType={tab}
        />
      </div>
    );
  }

  const filtered = projects.filter((p) => PHASES_BY_TYPE[tab].includes(p.phase));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200">
        {(["design", "build"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {LOG_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          해당하는 현장이 없어요.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-brand-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PHASE_BADGE_CLASS[p.phase]}`}
                  >
                    {PHASE_LABEL[p.phase]}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
