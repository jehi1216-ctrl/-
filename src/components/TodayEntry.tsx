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
import { formatDateLabel } from "@/lib/date";

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
  // 기본은 오늘이고, 필요할 때만 지난 날짜를 골라 뒤늦게 기록한다.
  const [entryDate, setEntryDate] = useState(date);
  const [pickingDate, setPickingDate] = useState(false);
  const isPastEntry = entryDate !== date;

  const datePicker = (
    <div className="flex flex-wrap items-center gap-2">
      {pickingDate || isPastEntry ? (
        <>
          <input
            type="date"
            value={entryDate}
            max={date}
            onChange={(e) => setEntryDate(e.target.value || date)}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {isPastEntry && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-300">
              {formatDateLabel(entryDate)} 기록으로 저장됩니다
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setEntryDate(date);
              setPickingDate(false);
            }}
            className="text-xs text-gray-400 hover:text-brand-600"
          >
            오늘로
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setPickingDate(true)}
          className="text-xs text-gray-400 hover:text-brand-600"
        >
          지난날 기록하기
        </button>
      )}
    </div>
  );

  if (selected) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-sm text-gray-500 hover:text-brand-600"
          >
            ← 다른 현장 선택
          </button>
          {datePicker}
        </div>
        <JournalForm
          date={entryDate}
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
      <div className="flex justify-end">{datePicker}</div>

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
