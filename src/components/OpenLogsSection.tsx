"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateLogStatus } from "@/app/(main)/dashboard/actions";
import { diffDays, formatShortDate } from "@/lib/date";
import { projectColorClass } from "@/lib/projectColor";
import { STATUS_LABEL, type JournalStatus, type WorkLog } from "@/types/journal";

const VISIBLE_COUNT = 5;

// 마감일까지 남은 기간을 배지 문구/색으로 바꾼다. 지난 것과 오늘 것만 눈에 띄게 한다.
function dueBadge(dueDate: string, today: string) {
  const days = diffDays(today, dueDate);
  if (days < 0) return { label: `${-days}일 지남`, className: "bg-red-100 text-red-700" };
  if (days === 0) return { label: "오늘", className: "bg-red-100 text-red-700" };
  if (days <= 7) return { label: `D-${days}`, className: "bg-amber-100 text-amber-700" };
  return { label: formatShortDate(dueDate), className: "bg-gray-100 text-gray-500" };
}

function OpenLogRow({
  log,
  projectName,
  today,
}: {
  log: WorkLog;
  projectName: string;
  today: string;
}) {
  const [isPending, startTransition] = useTransition();

  function move(status: JournalStatus) {
    startTransition(async () => {
      await updateLogStatus(log.id, status);
    });
  }

  const text = log.status === "todo" ? (log.next_action ?? log.content) : log.content;
  const badge =
    log.status === "todo" && log.next_action_date
      ? dueBadge(log.next_action_date, today)
      : null;

  return (
    <li
      className={`flex items-start justify-between gap-2 rounded-md border border-gray-100 px-3 py-2 transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
          <Link
            href={`/projects/${log.project_id}`}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${projectColorClass(
              log.project_id
            )}`}
          >
            {projectName}
          </Link>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
          <span className="text-[11px] text-gray-400">
            기록 {formatShortDate(log.date)}
          </span>
        </div>
        <p className="break-words text-sm text-gray-800">{text}</p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {log.status === "todo" ? (
          <button
            onClick={() => move("waiting")}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-violet-600"
          >
            대기
          </button>
        ) : (
          <button
            onClick={() => move("todo")}
            disabled={isPending}
            className="whitespace-nowrap text-xs text-gray-400 hover:text-amber-600"
          >
            내 할 일
          </button>
        )}
        <button
          onClick={() => move("done")}
          disabled={isPending}
          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-green-100 hover:text-green-700"
        >
          완료
        </button>
      </div>
    </li>
  );
}

function OpenLogGroup({
  status,
  logs,
  projectNames,
  today,
}: {
  status: JournalStatus;
  logs: WorkLog[];
  projectNames: Record<string, string>;
  today: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (logs.length === 0) return null;

  const visible = expanded ? logs : logs.slice(0, VISIBLE_COUNT);

  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium text-gray-400">
        {STATUS_LABEL[status]} {logs.length}
      </h3>
      <ul className="space-y-1.5">
        {visible.map((log) => (
          <OpenLogRow
            key={log.id}
            log={log}
            projectName={projectNames[log.project_id] ?? "알 수 없는 현장"}
            today={today}
          />
        ))}
      </ul>
      {logs.length > VISIBLE_COUNT && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-xs text-gray-400 hover:text-brand-600"
        >
          {expanded ? "접기" : `+${logs.length - VISIBLE_COUNT}건 더 보기`}
        </button>
      )}
    </div>
  );
}

export default function OpenLogsSection({
  logs,
  projectNames,
  today,
}: {
  logs: WorkLog[];
  projectNames: Record<string, string>;
  today: string;
}) {
  if (logs.length === 0) return null;

  const todoLogs = logs.filter((l) => l.status === "todo");
  const waitingLogs = logs.filter((l) => l.status === "waiting");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-3 text-sm font-medium text-gray-500">
        일지 미처리 {logs.length}건
        <span className="ml-2 text-xs font-normal text-gray-400">
          현장에 남아 있는 할 일과 답변 대기
        </span>
      </h2>
      <div className="space-y-4">
        <OpenLogGroup
          status="todo"
          logs={todoLogs}
          projectNames={projectNames}
          today={today}
        />
        <OpenLogGroup
          status="waiting"
          logs={waitingLogs}
          projectNames={projectNames}
          today={today}
        />
      </div>
    </div>
  );
}
