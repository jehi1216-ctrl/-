"use client";

import { useState } from "react";
import DecisionDatesField from "./DecisionDatesField";
import type { DecisionDate } from "@/types/journal";

// 종료할 때 결정사항과 협의된 날짜를 남길지 그냥 종료할지 고르는 인라인 입력.
// 둘 다 선택이고, 비워두면 그대로 종료되므로 버튼 문구로 지금 어느 쪽인지 보여준다.
export default function CloseLogPrompt({
  defaultDecision = "",
  defaultDecisionDates = [],
  pending = false,
  onConfirm,
  onCancel,
}: {
  defaultDecision?: string;
  defaultDecisionDates?: DecisionDate[];
  pending?: boolean;
  onConfirm: (decision: string, decisionDates: DecisionDate[]) => void;
  onCancel: () => void;
}) {
  const [decision, setDecision] = useState(defaultDecision);
  const [decisionDates, setDecisionDates] =
    useState<DecisionDate[]>(defaultDecisionDates);
  const hasDecision = decision.trim().length > 0;
  const hasDates = decisionDates.length > 0;
  // 무엇을 남기고 닫는지 버튼에 그대로 적는다.
  const confirmLabel = hasDecision
    ? hasDates
      ? "결정사항·날짜 남기고 종료"
      : "결정사항 남기고 종료"
    : hasDates
      ? "날짜 남기고 종료"
      : "그냥 종료";

  return (
    <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-2.5">
      <p className="mb-1 text-xs font-medium text-emerald-900">
        결정사항{" "}
        <span className="font-normal text-emerald-700">
          — 선택. 비워두면 그냥 종료됩니다
        </span>
      </p>
      <textarea
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
        rows={2}
        autoFocus
        placeholder="종료하면서 남길 결정사항"
        className="w-full rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />
      {/* 종료했다고 날짜가 없는 건 아니다 — 그날로 협의된 건이면 캘린더에 남아야 한다.
          여러 날에 걸쳐 협의되는 경우가 있어 날짜를 여러 개 담을 수 있다. */}
      <p className="mb-1 mt-2 text-xs font-medium text-emerald-900">협의된 날짜</p>
      <DecisionDatesField
        entries={decisionDates}
        onChange={setDecisionDates}
        tone="emerald"
        disabled={pending}
      />
      <div className="mt-1.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onConfirm(decision, decisionDates)}
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-xs text-gray-500 hover:underline"
        >
          취소
        </button>
      </div>
    </div>
  );
}
