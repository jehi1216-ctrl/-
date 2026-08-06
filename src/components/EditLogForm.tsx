"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateLog } from "@/app/(main)/dashboard/actions";
import { initialFormState, type FormState } from "@/app/(main)/dashboard/formState";
import type { WorkLog } from "@/types/journal";
import CategoryFieldset from "./CategoryFieldset";
import BuildCategoryFieldset from "./BuildCategoryFieldset";
import StatusFieldset from "./StatusFieldset";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "저장 중..." : "수정 저장"}
    </button>
  );
}

export default function EditLogForm({
  log,
  onCancel,
}: {
  log: WorkLog;
  onCancel: () => void;
}) {
  const boundUpdate = updateLog.bind(null, log.id);
  const [state, formAction] = useActionState<FormState, FormData>(
    boundUpdate,
    initialFormState
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    log.categories
  );

  useEffect(() => {
    if (state.success) {
      onCancel();
    }
  }, [state.success, state.submittedAt, onCancel]);

  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-brand-200 bg-brand-50/30 p-3"
    >
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {log.log_type === "build" ? (
        <BuildCategoryFieldset
          selectedCategories={selectedCategories}
          onToggle={toggleCategory}
        />
      ) : (
        <CategoryFieldset
          selectedCategories={selectedCategories}
          onToggle={toggleCategory}
          defaultDetails={log.category_details}
        />
      )}

      <div>
        <label htmlFor={`content-${log.id}`} className="mb-1 block text-sm font-medium">
          기록 <span className="text-gray-400">— 무엇을 했는지</span>
        </label>
        <textarea
          id={`content-${log.id}`}
          name="content"
          required
          rows={3}
          defaultValue={log.content}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label htmlFor={`result-${log.id}`} className="mb-1 block text-sm font-medium">
          결과 <span className="text-gray-400">— 선택</span>
        </label>
        <textarea
          id={`result-${log.id}`}
          name="result"
          rows={2}
          defaultValue={log.result ?? ""}
          placeholder="어떻게 마무리됐는지 적어주세요"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <StatusFieldset
        defaultStatus={log.status}
        defaultNextAction={log.next_action ?? ""}
        defaultNextActionDate={log.next_action_date ?? ""}
      />

      <div className="flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:underline"
        >
          취소
        </button>
      </div>
    </form>
  );
}
