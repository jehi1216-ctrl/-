"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import {
  addChecklistItem,
  updateChecklistItemStatus,
  deleteChecklistItem,
} from "@/app/(main)/projects/checklist-actions";
import { initialFormState, type FormState } from "@/app/(main)/dashboard/formState";
import {
  CHECKLIST_STATUS_OPTIONS,
  CHECKLIST_STATUS_BADGE_CLASS,
  type ChecklistItem,
  type ChecklistStatus,
  type ProjectContact,
} from "@/types/project";

const STATUS_ORDER: Record<ChecklistStatus, number> = {
  준비: 0,
  협의중: 1,
  진행중: 2,
  완료: 3,
};

function contactLabel(c: ProjectContact): string {
  return `${c.trade ? `[${c.trade}] ` : ""}${c.company}${c.contact_name ? ` · ${c.contact_name}` : ""}`;
}

export default function ProjectChecklist({
  projectId,
  items,
  contacts = [],
  compact = false,
  title = "체크리스트",
  groupByAssignee = false,
}: {
  projectId: string;
  items: ChecklistItem[];
  contacts?: ProjectContact[];
  compact?: boolean;
  title?: string;
  groupByAssignee?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const boundAdd = addChecklistItem.bind(null, projectId);
  const [state, formAction] = useActionState<FormState, FormData>(boundAdd, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success, state.submittedAt]);

  function handleStatusChange(itemId: string, status: ChecklistStatus) {
    startTransition(() => updateChecklistItemStatus(projectId, itemId, status));
  }

  function handleDelete(itemId: string) {
    startTransition(() => deleteChecklistItem(projectId, itemId));
  }

  const sorted = [...items].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );

  function resolveAssigneeLabel(item: ChecklistItem): string | null {
    const contact = item.assignee_contact_id
      ? contactById.get(item.assignee_contact_id)
      : undefined;
    return (contact ? contactLabel(contact) : item.assignee) || null;
  }

  const inputClass = `rounded-md border border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${
    compact ? "px-2 py-1 text-xs" : "px-2 py-1.5 text-sm"
  }`;

  function renderItem(item: ChecklistItem) {
    return (
      <li
        key={item.id}
        className={`flex items-start justify-between gap-2 rounded-md border border-gray-100 ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
        } ${isPending ? "opacity-50" : ""}`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <select
            value={item.status}
            disabled={isPending}
            onChange={(e) =>
              handleStatusChange(item.id, e.target.value as ChecklistStatus)
            }
            className={`mt-0.5 flex-shrink-0 rounded-full border-none py-0.5 pl-2 pr-6 text-xs font-medium disabled:opacity-60 ${CHECKLIST_STATUS_BADGE_CLASS[item.status]}`}
          >
            {CHECKLIST_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="min-w-0">
            <span
              className={
                item.status === "완료" ? "text-gray-400 line-through" : "text-gray-800"
              }
            >
              {item.content}
            </span>
            {!groupByAssignee &&
              (() => {
                const assigneeLabel = resolveAssigneeLabel(item);
                return (
                  assigneeLabel && (
                    <span className="ml-2 text-gray-400">{assigneeLabel}</span>
                  )
                );
              })()}
          </span>
        </div>
        <button
          onClick={() => handleDelete(item.id)}
          disabled={isPending}
          className="flex-shrink-0 text-gray-400 hover:text-red-500"
        >
          삭제
        </button>
      </li>
    );
  }

  const assigneeGroups = groupByAssignee
    ? (() => {
        const map = new Map<string, ChecklistItem[]>();
        for (const item of sorted) {
          const label = resolveAssigneeLabel(item) ?? "담당자 없음";
          const bucket = map.get(label) ?? [];
          bucket.push(item);
          map.set(label, bucket);
        }
        return [...map.entries()].sort(([a], [b]) => {
          if (a === "담당자 없음") return 1;
          if (b === "담당자 없음") return -1;
          return 0;
        });
      })()
    : null;

  const content = (
    <>
      {!compact && (
        <h2 className="mb-3 text-sm font-medium text-gray-500">{title}</h2>
      )}

      {sorted.length === 0 ? (
        <p className={`text-gray-400 ${compact ? "mb-2 text-xs" : "mb-3 text-sm"}`}>
          등록된 할 일이 없어요.
        </p>
      ) : assigneeGroups ? (
        <div className="mb-3 space-y-3">
          {assigneeGroups.map(([label, groupItems]) => (
            <div key={label}>
              <h3 className="mb-1 text-xs font-semibold text-gray-400">{label}</h3>
              <ul className="space-y-2">{groupItems.map((item) => renderItem(item))}</ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className={compact ? "mb-2 space-y-1" : "mb-3 space-y-2"}>
          {sorted.map((item) => renderItem(item))}
        </ul>
      )}

      {state.error && (
        <p className={`mb-2 rounded-md bg-red-50 px-2 py-1.5 text-red-600 ${compact ? "text-xs" : "text-sm"}`}>
          {state.error}
        </p>
      )}

      <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input name="content" required placeholder="할 일 *" className={`col-span-2 ${inputClass}`} />
        <select name="assignee_contact_id" defaultValue="" className={inputClass}>
          <option value="">담당자 없음</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {contactLabel(c)}
            </option>
          ))}
        </select>
        <select name="status" defaultValue="준비" className={inputClass}>
          {CHECKLIST_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
