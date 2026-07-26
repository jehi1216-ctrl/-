"use client";

import { useState, useTransition } from "react";
import { updateProgressNotes } from "@/app/(main)/projects/actions";

export default function ProgressNotes({
  projectId,
  notes,
}: {
  projectId: string;
  notes: string | null;
}) {
  const [value, setValue] = useState(notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateProgressNotes(projectId, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-2 text-sm font-medium text-gray-500">진행사항</h2>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder="현재 진행 상황을 간단히 기록하세요"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
        {saved && <span className="text-xs text-green-600">저장됨</span>}
      </div>
    </div>
  );
}
