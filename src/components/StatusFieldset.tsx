"use client";

import { useState } from "react";
import DecisionDatesField from "./DecisionDatesField";
import type { DecisionDate } from "@/types/journal";
import {
  STATUS_OPTIONS,
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  type JournalStatus,
} from "@/types/journal";

export default function StatusFieldset({
  defaultStatus = "todo",
  defaultNextAction = "",
  defaultNextActionDate = "",
  defaultNextActionTime = "",
  defaultDecision = "",
  defaultDecisionDates = [],
}: {
  defaultStatus?: JournalStatus;
  defaultNextAction?: string;
  defaultNextActionDate?: string;
  defaultNextActionTime?: string;
  defaultDecision?: string;
  defaultDecisionDates?: DecisionDate[];
}) {
  const [status, setStatus] = useState<JournalStatus>(defaultStatus);
  // 상태를 종료가 아닌 값으로 바꿔도 적어둔 날짜는 들고 있는다 — 되돌리면 그대로 살아난다.
  const [decisionDates, setDecisionDates] =
    useState<DecisionDate[]>(defaultDecisionDates);

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">상태</legend>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => (
          <label
            key={s}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
              status === s
                ? STATUS_BADGE_CLASS[s]
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
            {/* 시각은 선택. 날짜를 안 넣으면 서버에서 같이 버려진다. */}
            <input
              type="time"
              name="next_action_time"
              defaultValue={defaultNextActionTime}
              aria-label="마감 시각 (선택)"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-400">
              선택 — 넣으면 캘린더에 표시됩니다
            </span>
          </label>
        </div>
      )}

      {status === "done" && (
        <div className="mt-2">
          <textarea
            name="decision"
            rows={2}
            defaultValue={defaultDecision}
            placeholder="종료하면서 남길 결정사항 (선택)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {/* 마감(next_action_date)과는 다른 뜻이다 — 이건 '그날로 협의됐다'는 날짜다.
              여러 날에 걸쳐 협의되는 경우가 있어 날짜를 여러 개 담을 수 있다. */}
          <div className="mt-2">
            <p className="mb-1 text-sm text-gray-500">협의된 날짜</p>
            <DecisionDatesField
              entries={decisionDates}
              onChange={setDecisionDates}
              name="decision_dates"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            둘 다 비워두면 그냥 종료됩니다.
          </p>
        </div>
      )}
    </fieldset>
  );
}
