"use client";

import { useState } from "react";
import type { CalendarCell } from "@/lib/date";
import { projectColorClass, projectBarClass } from "@/lib/projectColor";
import { formatTime } from "@/lib/date";
import type { CalendarEntry } from "@/types/calendar";
import CalendarDayPanel from "./CalendarDayPanel";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_CHIPS = 3;

export default function CalendarGrid({
  weeks,
  entriesByDate,
  projects,
  today,
  initialDate,
}: {
  weeks: CalendarCell[][];
  entriesByDate: Record<string, CalendarEntry[]>;
  projects: { id: string; name: string }[];
  today: string;
  // 주간 업무에서 `?date=`로 들어온 날. 그 날짜를 펼친 채로 시작한다.
  initialDate?: string;
}) {
  // 칸이 좁아 내용이 잘리므로, 날짜를 누르면 아래에 그날 항목을 전문으로 펼치고
  // 거기서 바로 고칠 수 있게 한다.
  // 이 달 그리드에 없는 날짜로 들어오면 무시하고 아무것도 펼치지 않는다 —
  // 없는 날을 펼치면 빈 패널만 뜬다.
  const [selected, setSelected] = useState<string | null>(
    initialDate && weeks.some((w) => w.some((c) => c.date === initialDate))
      ? initialDate
      : null
  );

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
                        item.kind === "todo" || item.kind === "decision" ? (
                          <span
                            key={item.id}
                            className={`truncate rounded border-l-4 px-1 py-0.5 text-[10px] font-medium ${projectColorClass(
                              item.projectId
                            )} ${projectBarClass(item.projectId)}`}
                          >
                            {item.time && (
                              <span className="font-semibold tabular-nums">
                                {formatTime(item.time)}{" "}
                              </span>
                            )}
                            {item.label}
                          </span>
                        ) : (
                          <span
                            key={item.id}
                            className={`truncate rounded border-l-4 px-1 py-0.5 text-[10px] ${
                              item.projectId
                                ? `${projectColorClass(item.projectId)} ${projectBarClass(
                                    item.projectId
                                  )}`
                                : "border-l-gray-300 bg-gray-100 text-gray-600"
                            } ${item.done ? "line-through opacity-60" : ""}`}
                          >
                            {item.time && (
                              <span className="font-semibold tabular-nums">
                                {formatTime(item.time)}{" "}
                              </span>
                            )}
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
        <CalendarDayPanel
          key={selected}
          date={selected}
          entries={entriesByDate[selected] ?? []}
          projects={projects}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
