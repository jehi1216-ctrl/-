"use client";

import { addScheduleItem } from "@/app/(main)/dashboard/schedule-actions";
import { formatDateLabel } from "@/lib/date";
import type { WorkLog } from "@/types/journal";
import type { ScheduleItem } from "@/types/schedule";
import type { ProjectFile } from "@/types/project";
import JournalEntryCard from "./JournalEntryCard";
import { ScheduleRow } from "./CalendarDayPanel";

const SECTION_TITLE_CLASS = "mb-2 text-xs font-medium text-gray-400";

export default function ProjectCalendarDayPanel({
  date,
  projectId,
  projectName,
  logs,
  todos,
  schedules,
  filesByLog,
  onClose,
}: {
  date: string;
  projectId: string;
  projectName: string;
  logs: WorkLog[];
  todos: WorkLog[];
  schedules: ScheduleItem[];
  filesByLog: Record<string, ProjectFile[]>;
  onClose: () => void;
}) {
  const total = logs.length + todos.length + schedules.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-700">
          {formatDateLabel(date)}
          <span className="ml-2 text-xs font-normal text-gray-400">{total}건</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          닫기
        </button>
      </div>

      {logs.length > 0 && (
        <section className="mb-4">
          <h4 className={SECTION_TITLE_CLASS}>기록 {logs.length}건</h4>
          <ul className="space-y-3">
            {logs.map((log) => (
              <JournalEntryCard key={log.id} log={log} files={filesByLog[log.id]} />
            ))}
          </ul>
        </section>
      )}

      {todos.length > 0 && (
        <section className="mb-4">
          {/* 기록일이 아니라 마감일이 이 날인 일지. 왜 여기 있는지 알 수 있게 제목으로 구분한다. */}
          <h4 className={SECTION_TITLE_CLASS}>이 날이 마감인 할 일 {todos.length}건</h4>
          <ul className="space-y-3">
            {todos.map((log) => (
              <JournalEntryCard key={log.id} log={log} files={filesByLog[log.id]} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className={SECTION_TITLE_CLASS}>일정</h4>
        {schedules.length > 0 && (
          <ul className="mb-3 space-y-2">
            {schedules.map((item) => (
              <ScheduleRow
                key={item.id}
                date={date}
                // 수정 폼의 현장 선택칸이 지금 현장을 그대로 고르고 있어야 한다.
                // 빈 목록을 주면 저장할 때 조용히 '현장 없음'으로 풀려버린다.
                projects={[{ id: projectId, name: projectName }]}
                entry={{
                  kind: "schedule",
                  id: item.id,
                  label: item.content,
                  done: item.is_done,
                  projectId: item.project_id,
                  // 이 프로젝트 화면이라 현장 배지는 자기 자신을 가리키는 군더더기다.
                  projectName: null,
                }}
              />
            ))}
          </ul>
        )}
        <form action={addScheduleItem} className="flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="project_id" value={projectId} />
          <input
            name="content"
            required
            placeholder="이 날에 일정 추가"
            className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            추가
          </button>
        </form>
      </section>
    </div>
  );
}
