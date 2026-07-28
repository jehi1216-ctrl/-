"use client";

import { useState } from "react";
import JournalForm from "./JournalForm";
import JournalEntryCard from "./JournalEntryCard";
import type { Project, ProjectFile, ProjectContact } from "@/types/project";
import { LOG_TYPE_LABEL, type LogType, type WorkLog } from "@/types/journal";

const TABS: LogType[] = ["design", "build"];

export default function ProjectJournalTabs({
  project,
  date,
  designLogs,
  buildLogs,
  filesByLog,
  contacts = [],
}: {
  project: Project;
  date: string;
  designLogs: WorkLog[];
  buildLogs: WorkLog[];
  filesByLog: Record<string, ProjectFile[]>;
  contacts?: ProjectContact[];
}) {
  const [tab, setTab] = useState<LogType>("design");
  const logs = tab === "design" ? designLogs : buildLogs;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
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

      <JournalForm
        key={tab}
        date={date}
        projects={[project]}
        defaultProjectId={project.id}
        showChecklist={false}
        lockedLogType={tab}
        contactsByProject={{ [project.id]: contacts }}
      />

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">
          이 현장 {LOG_TYPE_LABEL[tab]} 기록 ({logs.length})
        </h2>
        {logs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            아직 작성한 업무 일지가 없어요.
          </p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <JournalEntryCard key={log.id} log={log} files={filesByLog[log.id]} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
