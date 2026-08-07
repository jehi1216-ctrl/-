"use client";

import { useState } from "react";

// 종료할 때 결정사항을 남길지 그냥 종료할지 고르는 인라인 입력.
// 비워두면 그대로 종료되므로 버튼 문구로 지금 어느 쪽인지 보여준다.
export default function CloseLogPrompt({
  defaultDecision = "",
  pending = false,
  onConfirm,
  onCancel,
}: {
  defaultDecision?: string;
  pending?: boolean;
  onConfirm: (decision: string) => void;
  onCancel: () => void;
}) {
  const [decision, setDecision] = useState(defaultDecision);
  const hasDecision = decision.trim().length > 0;

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
      <div className="mt-1.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onConfirm(decision)}
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {hasDecision ? "결정사항 남기고 종료" : "그냥 종료"}
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
