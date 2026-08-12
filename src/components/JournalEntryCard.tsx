"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  updateLogStatus,
  closeLog,
  deleteLog,
} from "@/app/(main)/dashboard/actions";
import {
  LOG_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  STATUS_OPTIONS,
  parseDecisionDates,
  type DecisionDate,
  type WorkLog,
} from "@/types/journal";
import { categoryBadges } from "@/lib/categoryDisplay";
import { formatTime } from "@/lib/date";
import ProjectFiles from "./ProjectFiles";
import EditLogForm from "./EditLogForm";
import CloseLogPrompt from "./CloseLogPrompt";
import type { ProjectFile } from "@/types/project";

export default function JournalEntryCard({
  log,
  projectName,
  files = [],
}: {
  log: WorkLog;
  projectName?: string;
  files?: ProjectFile[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);

  // 배지를 누르면 내가 할 일 → 답변 대기 → 종료 → ... 순으로 넘어간다.
  // 종료로 넘어갈 때만 결정사항을 남길지 물어본다.
  function cycleStatus() {
    const next =
      STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(log.status) + 1) % STATUS_OPTIONS.length];
    if (next === "done") {
      setClosing(true);
      return;
    }
    startTransition(async () => {
      await updateLogStatus(log.id, next);
    });
  }

  function handleClose(decision: string, decisionDates: DecisionDate[]) {
    startTransition(async () => {
      await closeLog(log.id, decision, decisionDates);
      setClosing(false);
    });
  }

  function handleDelete() {
    if (!confirm("이 건축일지를 삭제할까요?")) return;
    startTransition(async () => {
      await deleteLog(log.id);
    });
  }

  if (editing) {
    return (
      <li>
        <EditLogForm log={log} onCancel={() => setEditing(false)} />
      </li>
    );
  }

  const decisionDates = parseDecisionDates(log.decision_dates);

  return (
    <li
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                log.log_type === "build"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {LOG_TYPE_LABEL[log.log_type ?? "design"]}
            </span>
            {projectName && (
              <Link
                href={`/projects/${log.project_id}`}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                {projectName}
              </Link>
            )}
            {categoryBadges(log).map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
              >
                {badge}
              </span>
            ))}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
            {log.content}
          </p>
          {log.result && (
            <p className="mt-1.5 whitespace-pre-wrap break-words border-l-2 border-gray-200 pl-2 text-sm text-gray-600">
              <span className="font-medium text-gray-500">코멘트 </span>
              {log.result}
            </p>
          )}
          {log.status === "done" && (log.decision || decisionDates.length > 0) && (
            <div className="mt-1.5 rounded-md bg-emerald-50 px-2 py-1 text-sm text-emerald-900">
              {log.decision && (
                <p className="whitespace-pre-wrap break-words">
                  <span className="font-medium">결정 </span>
                  {log.decision}
                </p>
              )}
              {decisionDates.length > 0 && (
                <ul className={log.decision ? "mt-1 space-y-0.5" : "space-y-0.5"}>
                  {decisionDates.map((d) => (
                    <li key={d.date} className="break-words text-xs">
                      <span className="font-medium tabular-nums">
                        협의 {d.date}
                        {d.time && ` ${d.time}`}
                      </span>
                      {d.content && <span className="ml-1.5">{d.content}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {log.status === "todo" && log.next_action && (
            <p className="mt-1.5 whitespace-pre-wrap break-words rounded-md bg-amber-50 px-2 py-1 text-sm text-amber-800">
              <span className="font-medium">할 일 </span>
              {log.next_action}
              {log.next_action_date && (
                <span className="ml-1 text-xs text-amber-600">
                  ({log.next_action_date}
                  {log.next_action_time && ` ${formatTime(log.next_action_time)}`})
                </span>
              )}
            </p>
          )}
          <ProjectFiles
            projectId={log.project_id}
            workLogId={log.id}
            files={files}
            compact
          />
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <button
            onClick={cycleStatus}
            disabled={isPending}
            title="눌러서 상태 변경"
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[log.status]}`}
          >
            {STATUS_LABEL[log.status]}
          </button>
          <button
            onClick={() => setEditing(true)}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-brand-600"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            삭제
          </button>
        </div>
      </div>

      {closing && (
        <CloseLogPrompt
          defaultDecision={log.decision ?? ""}
          defaultDecisionDates={parseDecisionDates(log.decision_dates)}
          pending={isPending}
          onConfirm={handleClose}
          onCancel={() => setClosing(false)}
        />
      )}
    </li>
  );
}
