"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PHASE_LABEL,
  PHASE_BADGE_CLASS,
  CHECKLIST_STATUS_BADGE_CLASS,
  type Project,
  type ProjectPhase,
  type ChecklistItem,
} from "@/types/project";
import { LOG_TYPE_LABEL, type LogType } from "@/types/journal";

const PHASES_BY_TYPE: Record<LogType, ProjectPhase[]> = {
  design: ["design", "permit"],
  build: ["construction", "completed"],
};

export default function ProjectListTabs({
  projects,
  checklistsByProject = {},
}: {
  projects: Project[];
  checklistsByProject?: Record<string, ChecklistItem[]>;
}) {
  const [tab, setTab] = useState<LogType>("design");
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
            {LOG_TYPE_LABEL[t]} ({projects.filter((p) => PHASES_BY_TYPE[t].includes(p.phase)).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          해당하는 현장이 없어요.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-brand-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-medium">{p.name}</h2>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PHASE_BADGE_CLASS[p.phase]}`}
                  >
                    {PHASE_LABEL[p.phase]}
                  </span>
                </div>
                {(p.client || p.site_address) && (
                  <p className="mt-1 text-sm text-gray-500">
                    {[p.client, p.site_address].filter(Boolean).join(" · ")}
                  </p>
                )}
                {(checklistsByProject[p.id] ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                    {(checklistsByProject[p.id] ?? []).map((item) => (
                      <li key={item.id} className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`flex-shrink-0 rounded-full px-1.5 py-0.5 font-medium ${CHECKLIST_STATUS_BADGE_CLASS[item.status]}`}
                        >
                          {item.status}
                        </span>
                        <span className="truncate text-gray-600">{item.content}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
