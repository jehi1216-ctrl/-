"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  updateNextAction,
  updateLogStatus,
  closeLog,
} from "@/app/(main)/dashboard/actions";
import {
  addScheduleItem,
  toggleScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from "@/app/(main)/dashboard/schedule-actions";
import { formatDateLabel } from "@/lib/date";
import { projectColorClass, projectBarClass } from "@/lib/projectColor";
import type { CalendarEntry } from "@/types/calendar";
import CloseLogPrompt from "./CloseLogPrompt";

const INPUT_CLASS =
  "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function TodoRow({
  entry,
  date,
}: {
  entry: Extract<CalendarEntry, { kind: "todo" }>;
  date: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [label, setLabel] = useState(entry.label);
  const [dueDate, setDueDate] = useState(date);

  function save() {
    startTransition(async () => {
      await updateNextAction(entry.id, label, dueDate);
      setEditing(false);
    });
  }

  function cancel() {
    setLabel(entry.label);
    setDueDate(date);
    setEditing(false);
  }

  return (
    <li
      className={`rounded-md border border-gray-100 border-l-4 p-2.5 transition-opacity ${projectBarClass(
        entry.projectId
      )} ${isPending ? "opacity-50" : ""}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <Link
          href={`/projects/${entry.projectId}`}
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${projectColorClass(
            entry.projectId
          )}`}
        >
          {entry.projectName}
        </Link>
        <span className="text-[11px] text-gray-400">{entry.logDate} 작성</span>
      </div>

      {editing ? (
        <div className="space-y-1.5">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            className={INPUT_CLASS}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-400">비우면 캘린더에서 빠집니다</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending || !label.trim()}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              저장
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              className="text-xs text-gray-500 hover:underline"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words text-sm font-medium text-gray-900">
            {entry.label}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words border-l-2 border-gray-200 pl-2 text-xs text-gray-500">
            {entry.content}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-brand-600"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await updateLogStatus(entry.id, "waiting");
                })
              }
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-violet-600"
            >
              답변 대기로
            </button>
            <button
              type="button"
              onClick={() => setClosing(true)}
              disabled={isPending}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-emerald-100 hover:text-emerald-800"
            >
              종료
            </button>
          </div>
        </>
      )}

      {closing && (
        <CloseLogPrompt
          pending={isPending}
          onConfirm={(decision) =>
            startTransition(async () => {
              await closeLog(entry.id, decision);
              setClosing(false);
            })
          }
          onCancel={() => setClosing(false)}
        />
      )}
    </li>
  );
}

function ScheduleRow({
  entry,
  date,
}: {
  entry: Extract<CalendarEntry, { kind: "schedule" }>;
  date: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(entry.label);
  const [itemDate, setItemDate] = useState(date);

  function save() {
    startTransition(async () => {
      await updateScheduleItem(entry.id, content, itemDate);
      setEditing(false);
    });
  }

  function cancel() {
    setContent(entry.label);
    setItemDate(date);
    setEditing(false);
  }

  return (
    <li
      className={`rounded-md border border-gray-100 border-l-4 border-l-gray-300 p-2.5 transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {editing ? (
        <div className="space-y-1.5">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            className={INPUT_CLASS}
          />
          <input
            type="date"
            value={itemDate}
            onChange={(e) => setItemDate(e.target.value)}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending || !content.trim() || !itemDate}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              저장
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              className="text-xs text-gray-500 hover:underline"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <label className="flex flex-1 items-start gap-2">
            <input
              type="checkbox"
              checked={entry.done}
              onChange={() =>
                startTransition(async () => {
                  await toggleScheduleItem(entry.id, !entry.done);
                })
              }
              disabled={isPending}
              className="mt-0.5"
            />
            <span
              className={`whitespace-pre-wrap break-words text-sm ${
                entry.done ? "text-gray-400 line-through" : "text-gray-800"
              }`}
            >
              {entry.label}
            </span>
          </label>
          <div className="flex flex-shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-brand-600"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await deleteScheduleItem(entry.id);
                })
              }
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function CalendarDayPanel({
  date,
  entries,
  onClose,
}: {
  date: string;
  entries: CalendarEntry[];
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-gray-700">
          {formatDateLabel(date)}
          <span className="ml-2 text-xs font-normal text-gray-400">
            {entries.length}건
          </span>
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          닫기
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="mb-3 text-sm text-gray-400">이 날에는 등록된 항목이 없어요.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {entries.map((entry) =>
            entry.kind === "todo" ? (
              <TodoRow key={entry.id} entry={entry} date={date} />
            ) : (
              <ScheduleRow key={entry.id} entry={entry} date={date} />
            )
          )}
        </ul>
      )}

      {/* 일지의 '할 일'은 일지에서 나오므로, 여기서 새로 만들 수 있는 건 일정뿐이다. */}
      <form action={addScheduleItem} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="date" value={date} />
        <input
          name="content"
          required
          placeholder="이 날에 일정 추가"
          className={INPUT_CLASS}
        />
        <button
          type="submit"
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          추가
        </button>
      </form>
    </div>
  );
}
