"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { currentMonthKST, shiftMonth, type CalendarCell } from "@/lib/date";
import { STATUS_BADGE_CLASS, type WorkLog } from "@/types/journal";
import type { ScheduleItem } from "@/types/schedule";
import type { ProjectFile } from "@/types/project";
import ProjectCalendarDayPanel from "./ProjectCalendarDayPanel";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_CHIPS = 3;

// 한 프로젝트만 담는 달력이라 현장 색(projectColorClass)으로는 아무것도 구분되지 않는다.
// 대신 항목의 종류로 색을 나눈다. 전역 캘린더처럼 완성된 클래스 문자열로 둬야 Tailwind가 찾는다.
const CHIP_CLASS = {
  log: "border-l-brand-500 bg-brand-50 text-brand-800",
  todo: "border-l-amber-500 bg-amber-100 text-amber-900",
  schedule: "border-l-gray-400 bg-gray-100 text-gray-600",
} as const;

const LEGEND = [
  { kind: "log", label: "기록" },
  { kind: "todo", label: "할 일 마감" },
  { kind: "schedule", label: "일정" },
] as const;

const NAV_LINK_CLASS = "rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100";

// 답변 대기는 '내가 손 놓고 기다리는 중'이라 달력에서 제일 먼저 눈에 띄어야 한다.
// 칸이 좁아 배지를 넣을 자리가 없으므로 상태 색(보라) 점 하나로 표시한다.
const WAITING_DOT_CLASS = "h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500";

interface DayChip {
  id: string;
  kind: keyof typeof CHIP_CLASS;
  prefix: string;
  text: string;
  muted: boolean;
  waiting: boolean;
}

interface DayBucket {
  logs: WorkLog[];
  todos: WorkLog[];
  schedules: ScheduleItem[];
}

export default function ProjectCalendar({
  projectId,
  projectName,
  month,
  weeks,
  today,
  logs,
  todos,
  schedules,
  filesByLog,
  totalLogs,
  waitingCount,
  firstLogMonth,
  lastLogMonth,
}: {
  projectId: string;
  projectName: string;
  month: string; // YYYY-MM
  weeks: CalendarCell[][];
  today: string;
  logs: WorkLog[]; // 이 달 그리드 범위에 기록일(date)이 걸린 일지
  todos: WorkLog[]; // 마감일(next_action_date)이 걸린 '내가 할 일' 일지
  schedules: ScheduleItem[];
  filesByLog: Record<string, ProjectFile[]>;
  totalLogs: number;
  waitingCount: number; // 이 프로젝트에서 아직 답을 못 받은 일지 — 달이 달라도 항상 보인다
  firstLogMonth: string | null;
  lastLogMonth: string | null;
}) {
  // 칸이 좁아 내용이 잘리므로, 날짜를 누르면 아래에 그날 항목을 전문으로 펼친다.
  const [selected, setSelected] = useState<string | null>(null);

  const buckets = useMemo(() => {
    const map = new Map<string, DayBucket>();
    function at(date: string): DayBucket {
      let bucket = map.get(date);
      if (!bucket) {
        bucket = { logs: [], todos: [], schedules: [] };
        map.set(date, bucket);
      }
      return bucket;
    }

    for (const log of logs) at(log.date).logs.push(log);
    for (const log of todos) {
      if (!log.next_action_date || !log.next_action) continue;
      // 기록일과 마감일이 같으면 이미 기록 쪽에 들어가 있다. 같은 일지를 두 번 보여주지 않는다.
      if (log.next_action_date === log.date) continue;
      at(log.next_action_date).todos.push(log);
    }
    for (const item of schedules) at(item.date).schedules.push(item);

    return map;
  }, [logs, todos, schedules]);

  // 칸에 들어갈 줄은 세 종류를 한 줄로 세워 잘라야 한다(종류마다 따로 자르면 한 칸에 아홉 줄이 들어간다).
  const chipsByDate = useMemo(() => {
    const map = new Map<string, DayChip[]>();
    for (const [date, bucket] of buckets) {
      map.set(date, [
        ...bucket.logs.map((log) => ({
          id: log.id,
          kind: "log" as const,
          prefix: log.categories[0] ?? "",
          text: log.content,
          muted: false,
          waiting: log.status === "waiting",
        })),
        ...bucket.todos.map((log) => ({
          id: log.id,
          kind: "todo" as const,
          prefix: "할 일",
          text: log.next_action ?? "",
          muted: false,
          waiting: false,
        })),
        ...bucket.schedules.map((item) => ({
          id: item.id,
          kind: "schedule" as const,
          prefix: "",
          text: item.content,
          muted: item.is_done,
          waiting: false,
        })),
      ]);
    }
    return map;
  }, [buckets]);

  const [y, m] = month.split("-").map(Number);
  const monthIsEmpty = buckets.size === 0;
  const base = `/projects/${projectId}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-gray-500">진행 기록</h2>
          <p className="text-base font-semibold">
            {y}년 {m}월
          </p>
          <p className="text-sm text-gray-500">
            날짜를 누르면 그날 기록을 전문으로 보고 바로 고칠 수 있어요.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            scroll={false}
            href={`${base}?month=${shiftMonth(month, -1)}`}
            className={NAV_LINK_CLASS}
          >
            이전
          </Link>
          <Link
            scroll={false}
            href={`${base}?month=${currentMonthKST()}`}
            className={NAV_LINK_CLASS}
          >
            이번 달
          </Link>
          <Link
            scroll={false}
            href={`${base}?month=${shiftMonth(month, 1)}`}
            className={NAV_LINK_CLASS}
          >
            다음
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
        {LEGEND.map((item) => (
          <span key={item.kind} className="flex items-center gap-1.5">
            <span
              className={`h-3 w-3 rounded-sm border-l-4 ${CHIP_CLASS[item.kind]}`}
            />
            {item.label}
          </span>
        ))}
        {totalLogs > 0 && firstLogMonth && lastLogMonth && (
          <span className="text-gray-400">
            기록 {totalLogs}건 ·{" "}
            <Link
              scroll={false}
              href={`${base}?month=${firstLogMonth}`}
              className="underline-offset-2 hover:text-brand-600 hover:underline"
            >
              처음 {firstLogMonth}
            </Link>{" "}
            ~{" "}
            <Link
              scroll={false}
              href={`${base}?month=${lastLogMonth}`}
              className="underline-offset-2 hover:text-brand-600 hover:underline"
            >
              최근 {lastLogMonth}
            </Link>
          </span>
        )}
        {/* 답변 대기는 기록일 칸에만 찍히므로 지난 달로 밀려나면 달력에서 사라진다.
            몇 건이 물려 있는지는 어느 달을 보고 있든 여기서 항상 보이게 둔다. */}
        {waitingCount > 0 && (
          <Link
            href={`/journal?project=${projectId}`}
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${STATUS_BADGE_CLASS.waiting}`}
          >
            <span className={WAITING_DOT_CLASS} />
            답변 대기 {waitingCount}건
          </Link>
        )}
      </div>

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
                const chips = chipsByDate.get(cell.date) ?? [];
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
                      {chips.slice(0, MAX_CHIPS).map((chip) => (
                        <span
                          key={chip.id}
                          title={chip.waiting ? "답변 대기" : undefined}
                          className={`flex items-center gap-1 rounded border-l-4 px-1 py-0.5 text-[10px] ${
                            CHIP_CLASS[chip.kind]
                          } ${chip.muted ? "line-through opacity-60" : ""}`}
                        >
                          {chip.waiting && <span className={WAITING_DOT_CLASS} />}
                          {/* flex 안에서는 min-w-0이 없으면 truncate가 먹지 않고 칸을 밀어낸다. */}
                          <span className="min-w-0 truncate">
                            {chip.prefix && (
                              <span className="font-semibold">{chip.prefix} </span>
                            )}
                            {chip.text}
                          </span>
                        </span>
                      ))}
                      {chips.length > MAX_CHIPS && (
                        <span className="text-[10px] text-gray-400">
                          +{chips.length - MAX_CHIPS}건 더
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

      {/* 기록이 전부 다른 달에 있으면 빈 달력만 보여 길을 잃는다. 어디를 봐야 하는지 알려준다. */}
      {monthIsEmpty &&
        (totalLogs === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            아직 이 프로젝트에 기록이 없어요. 상단 메뉴의 `오늘 기록`에서 남길 수 있어요.
          </p>
        ) : (
          lastLogMonth && (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
              이 달에는 기록이 없어요. 최근 기록은{" "}
              <Link
                scroll={false}
                href={`${base}?month=${lastLogMonth}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {lastLogMonth}
              </Link>
              에 있어요.
            </p>
          )
        ))}

      {selected && (
        <ProjectCalendarDayPanel
          key={selected}
          date={selected}
          projectId={projectId}
          projectName={projectName}
          logs={buckets.get(selected)?.logs ?? []}
          todos={buckets.get(selected)?.todos ?? []}
          schedules={buckets.get(selected)?.schedules ?? []}
          filesByLog={filesByLog}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
