"use client";

import { useState } from "react";
import {
  STATUS_OPTIONS,
  STATUS_LABEL,
  type JournalStatus,
} from "@/types/journal";

export default function StatusFieldset({
  defaultStatus = "todo",
  defaultNextAction = "",
  defaultNextActionDate = "",
}: {
  defaultStatus?: JournalStatus;
  defaultNextAction?: string;
  defaultNextActionDate?: string;
}) {
  const [status, setStatus] = useState<JournalStatus>(defaultStatus);

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">상태</legend>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => (
          <label
            key={s}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
              status === s
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <input
              type="radio"
              name="status"
              value={s}
              checked={status === s}
              onChange={() => setStatus(s)}
              className="sr-only"
            />
            {STATUS_LABEL[s]}
          </label>
        ))}
      </div>

      {status === "todo" && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            name="next_action"
            defaultValue={defaultNextAction}
            placeholder="다음에 내가 할 일"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <label className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>날짜</span>
            <input
              type="date"
              name="next_action_date"
              defaultValue={defaultNextActionDate}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-400">
              선택 — 넣으면 캘린더에 표시됩니다
            </span>
          </label>
        </div>
      )}
    </fieldset>
  );
}
