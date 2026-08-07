"use client";

import { useTransition } from "react";
import {
  addScheduleItem,
  toggleScheduleItem,
  deleteScheduleItem,
} from "@/app/(main)/dashboard/schedule-actions";
import { projectColorClass } from "@/lib/projectColor";
import type { ScheduleItem } from "@/types/schedule";

export default function ScheduleSection({
  date,
  items,
  projects,
}: {
  date: string;
  items: ScheduleItem[];
  projects: { id: string; name: string }[];
}) {
  const projectNames = new Map(projects.map((p) => [p.id, p.name]));
  const [isPending, startTransition] = useTransition();

  function handleToggle(item: ScheduleItem) {
    startTransition(() => toggleScheduleItem(item.id, !item.is_done));
  }

  function handleDelete(id: string) {
    startTransition(() => deleteScheduleItem(id));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-3 text-sm font-medium text-gray-500">할 일 / 일정</h2>

      {items.length === 0 ? (
        <p className="mb-3 text-sm text-gray-400">등록된 할 일이 없어요.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm ${
                isPending ? "opacity-50" : ""
              }`}
            >
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.is_done}
                  onChange={() => handleToggle(item)}
                  disabled={isPending}
                />
                {item.project_id && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${projectColorClass(
                      item.project_id
                    )}`}
                  >
                    {projectNames.get(item.project_id) ?? "알 수 없는 현장"}
                  </span>
                )}
                <span className={item.is_done ? "text-gray-400 line-through" : "text-gray-800"}>
                  {item.content}
                </span>
              </label>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={addScheduleItem} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="date"
          name="date"
          defaultValue={date}
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-40"
        />
        <input
          name="content"
          required
          placeholder="할 일을 입력하세요"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          name="project_id"
          defaultValue=""
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-40"
        >
          <option value="">현장 없음</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
