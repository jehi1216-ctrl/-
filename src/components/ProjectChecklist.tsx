"use client";

import { useTransition } from "react";
import {
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/app/(main)/projects/checklist-actions";
import type { ChecklistItem } from "@/types/project";

export default function ProjectChecklist({
  projectId,
  items,
  compact = false,
}: {
  projectId: string;
  items: ChecklistItem[];
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const boundAdd = addChecklistItem.bind(null, projectId);

  function handleToggle(item: ChecklistItem) {
    startTransition(() => toggleChecklistItem(projectId, item.id, !item.is_done));
  }

  function handleDelete(itemId: string) {
    startTransition(() => deleteChecklistItem(projectId, itemId));
  }

  const sorted = [...items].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : 1;
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  const inputClass = `rounded-md border border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
    compact ? "px-2 py-1 text-xs" : "px-2 py-1.5 text-sm"
  }`;

  const content = (
    <>
      {!compact && (
        <h2 className="mb-3 text-sm font-medium text-gray-500">체크리스트</h2>
      )}

      {sorted.length === 0 ? (
        <p className={`text-gray-400 ${compact ? "mb-2 text-xs" : "mb-3 text-sm"}`}>
          등록된 할 일이 없어요.
        </p>
      ) : (
        <ul className={compact ? "mb-2 space-y-1" : "mb-3 space-y-2"}>
          {sorted.map((item) => (
            <li
              key={item.id}
              className={`flex items-start justify-between gap-2 rounded-md border border-gray-100 ${
                compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
              } ${isPending ? "opacity-50" : ""}`}
            >
              <label className="flex min-w-0 flex-1 items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.is_done}
                  onChange={() => handleToggle(item)}
                  disabled={isPending}
                  className="mt-0.5 flex-shrink-0"
                />
                <span className="min-w-0">
                  <span
                    className={
                      item.is_done ? "text-gray-400 line-through" : "text-gray-800"
                    }
                  >
                    {item.content}
                  </span>
                  {(item.assignee || item.due_date) && (
                    <span className="ml-2 text-gray-400">
                      {[item.assignee, item.due_date].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
              </label>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="flex-shrink-0 text-gray-400 hover:text-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={boundAdd} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input name="content" required placeholder="할 일 *" className={`col-span-2 ${inputClass}`} />
        <input name="assignee" placeholder="담당자" className={inputClass} />
        <input name="due_date" type="date" className={inputClass} />
        <button
          type="submit"
          className={`col-span-2 rounded-md bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 sm:col-span-4 ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          할 일 추가
        </button>
      </form>
    </>
  );

  if (compact) {
    return <div className="mt-2 border-t border-gray-100 pt-2">{content}</div>;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      {content}
    </div>
  );
}
