"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createLog } from "@/app/(main)/dashboard/actions";
import {
  initialFormState,
  type FormState,
} from "@/app/(main)/dashboard/formState";
import type { Project, ChecklistItem } from "@/types/project";
import ProjectChecklist from "./ProjectChecklist";
import CategoryFieldset from "./CategoryFieldset";

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
  projects,
  defaultProjectId,
  checklistsByProject = {},
  showChecklist = true,
}: {
  date: string;
  projects: Project[];
  defaultProjectId?: string;
  checklistsByProject?: Record<string, ChecklistItem[]>;
  showChecklist?: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    createLog,
    initialFormState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <input type="hidden" name="date" value={date} />

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="project_id" className="mb-1 block text-sm font-medium">
          프로젝트(현장)
        </label>
        <select
          id="project_id"
          name="project_id"
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="" disabled>
            프로젝트를 선택하세요
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {showChecklist && projectId && (
          <ProjectChecklist
            projectId={projectId}
            items={checklistsByProject[projectId] ?? []}
            compact
          />
        )}
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium">
          업무 내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={3}
          placeholder="오늘 한 일을 적어주세요"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <CategoryFieldset selectedCategories={selectedCategories} onToggle={toggleCategory} />

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">
          상태
        </label>
        <select
          id="status"
          name="status"
          defaultValue="in_progress"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-48"
        >
          <option value="in_progress">진행중</option>
          <option value="done">완료</option>
        </select>
      </div>

      <SubmitButton />
    </form>
  );
}
