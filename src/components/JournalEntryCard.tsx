"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  updateLogStatus,
  deleteLog,
} from "@/app/(main)/dashboard/actions";
import { STATUS_LABEL, type WorkLog } from "@/types/journal";
import { categoryBadges } from "@/lib/categoryDisplay";
import ProjectFiles from "./ProjectFiles";
import EditLogForm from "./EditLogForm";
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
  const isDone = log.status === "done";

  function toggleStatus() {
    startTransition(async () => {
      await updateLogStatus(log.id, isDone ? "in_progress" : "done");
    });
  }

  function handleDelete() {
    if (!confirm("이 업무 일지를 삭제할까요?")) return;
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

  return (
    <li
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
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
          <ProjectFiles
            projectId={log.project_id}
            workLogId={log.id}
            files={files}
            compact
          />
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <button
            onClick={toggleStatus}
            disabled={isPending}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isDone
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
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
    </li>
  );
}
