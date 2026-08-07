"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateLabel, type CalendarCell } from "@/lib/date";
import { projectColorClass, projectBarClass } from "@/lib/projectColor";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_CHIPS = 3;

// 캘린더 한 칸에 들어가는 항목. 일정(schedule_items)과 일지의 '내가 할 일'을 함께 보여준다.
export type CalendarEntry =
  | { kind: "schedule"; id: string; label: string; done: boolean }
  | {
      kind: "todo";
      id: string;
      label: string;
      projectId: string;
      projectName: string;
      content: string;
      logDate: string;
    };

export default function CalendarGrid({
  weeks,
  entriesByDate,
  today,
}: {
  weeks: CalendarCell[][];
  entriesByDate: Record<string, CalendarEntry[]>;
  today: string;
}) {
  // 칸이 좁아 내용이 잘리므로, 날짜를 누르면 아래에 그날 항목을 전문으로 펼친다.
  const [selected, setSelected] = useState<string | null>(null);
  const selectedEntries = selected ? (entriesByDate[selected] ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[640px] rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-medium text-gray-400">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 border-b border-gray-100 last:border-b-0"
            >
              {week.map((cell) => {
                const dayItems = entriesByDate[cell.date] ?? [];
                const dayNum = Number(cell.date.slice(8, 10));
                const isToday = cell.date === today;
                const isSelected = cell.date === selected;
                return (
                  <button
                    type="button"
                    key={cell.date}
                    onClick={() => setSelected(isSelected ? null : cell.date)}
                    className={`flex min-h-[96px] flex-col gap-1 border-r border-gray-100 p-1.5 text-left last:border-r-0 hover:bg-brand-50/40 ${
                      cell.inMonth ? "" : "bg-gray-50/50"
                    } ${isSelected ? "ring-2 ring-inset ring-brand-500" : ""}`}
                  >
                    <span
                      className={`text-xs ${
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 font-semibold text-white"
                          : cell.inMonth
                            ? "text-gray-500"
                            : "text-gray-300"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div className="flex w-full flex-col gap-0.5">
                      {dayItems.slice(0, MAX_CHIPS).map((item) =>
                        item.kind === "todo" ? (
                          <span
                            key={item.id}
                            className={`truncate rounded border-l-4 px-1 py-0.5 text-[10px] font-medium ${projectColorClass(
                              item.projectId
                            )} ${projectBarClass(item.projectId)}`}
                          >
                            {item.label}
                          </span>
                        ) : (
                          <span
                            key={item.id}
                            className={`truncate rounded border-l-4 border-l-gray-300 px-1 py-0.5 text-[10px] ${
                              item.done
                                ? "bg-gray-100 text-gray-400 line-through"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.label}
                          </span>
                        )
                      )}
                      {dayItems.length > MAX_CHIPS && (
                        <span className="text-[10px] text-gray-400">
                          +{dayItems.length - MAX_CHIPS}건 더
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-gray-700">
              {formatDateLabel(selected)}
              <span className="ml-2 text-xs font-normal text-gray-400">
                {selectedEntries.length}건
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>

          {selectedEntries.length === 0 ? (
            <p className="text-sm text-gray-400">이 날에는 등록된 항목이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEntries.map((item) =>
                item.kind === "todo" ? (
                  <li
                    key={item.id}
                    className={`rounded-md border border-gray-100 border-l-4 p-2.5 ${projectBarClass(
                      item.projectId
                    )}`}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/projects/${item.projectId}`}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${projectColorClass(
                          item.projectId
                        )}`}
                      >
                        {item.projectName}
                      </Link>
                      <span className="text-[11px] text-gray-400">
                        {item.logDate} 작성
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm font-medium text-gray-900">
                      {item.label}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words border-l-2 border-gray-200 pl-2 text-xs text-gray-500">
                      {item.content}
                    </p>
                  </li>
                ) : (
                  <li
                    key={item.id}
                    className="rounded-md border border-gray-100 border-l-4 border-l-gray-300 p-2.5"
                  >
                    <p
                      className={`whitespace-pre-wrap break-words text-sm ${
                        item.done ? "text-gray-400 line-through" : "text-gray-800"
                      }`}
                    >
                      {item.label}
                    </p>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
