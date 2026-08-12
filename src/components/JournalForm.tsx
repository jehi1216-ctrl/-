"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createLog } from "@/app/(main)/dashboard/actions";
import {
  initialFormState,
  type FormState,
} from "@/app/(main)/dashboard/formState";
import type { ChecklistItem, ProjectContact } from "@/types/project";
import { LOG_TYPE_LABEL, type LogType } from "@/types/journal";
import ProjectChecklist from "./ProjectChecklist";
import CategoryFieldset from "./CategoryFieldset";
import BuildCategoryFieldset from "./BuildCategoryFieldset";
import StatusFieldset from "./StatusFieldset";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "저장 중..." : "저장"}
    </button>
  );
}

export default function JournalForm({
  date,
  projectId,
  checklistsByProject = {},
  contactsByProject = {},
  lockedLogType,
}: {
  date: string;
  projectId: string;
  checklistsByProject?: Record<string, ChecklistItem[]>;
  contactsByProject?: Record<string, ProjectContact[]>;
  lockedLogType?: LogType;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    createLog,
    initialFormState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [logType, setLogType] = useState<LogType>(lockedLogType ?? "design");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [lastHandledSubmit, setLastHandledSubmit] = useState(state.submittedAt);

  if (state.success && state.submittedAt !== lastHandledSubmit) {
    setLastHandledSubmit(state.submittedAt);
    setSelectedCategories([]);
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success, state.submittedAt]);

  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function changeLogType(next: LogType) {
    setLogType(next);
    setSelectedCategories([]);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="log_type" value={logType} />
      <input type="hidden" name="project_id" value={projectId} />

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {!lockedLogType && (
        <div className="flex gap-2">
          {(["design", "build"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeLogType(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                logType === t
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {LOG_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      {logType === "design" ? (
        <CategoryFieldset selectedCategories={selectedCategories} onToggle={toggleCategory} />
      ) : (
        <BuildCategoryFieldset selectedCategories={selectedCategories} onToggle={toggleCategory} />
      )}

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium">
          기록 <span className="text-gray-400">— 무엇을 했는지</span>
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={3}
          placeholder="오늘 한 일을 적어주세요"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        {projectId && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setChecklistOpen((o) => !o)}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              {checklistOpen
                ? "체크리스트 접기"
                : `+ 체크리스트 추가/보기${
                    (checklistsByProject[projectId] ?? []).filter((i) => !i.is_done).length
                      ? ` (${(checklistsByProject[projectId] ?? []).filter((i) => !i.is_done).length})`
                      : ""
                  }`}
            </button>
            {checklistOpen && (
              <ProjectChecklist
                projectId={projectId}
                items={checklistsByProject[projectId] ?? []}
                contacts={contactsByProject[projectId] ?? []}
                compact
              />
            )}
          </div>
        )}
      </div>

      {/* 결과칸은 걷어냈다 — 종료는 결정사항, 답변 대기는 코멘트가 그 자리를 받는다. */}
      <StatusFieldset key={state.submittedAt} />

      <SubmitButton />
    </form>
  );
}
