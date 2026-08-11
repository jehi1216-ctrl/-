"use client";

import { useState } from "react";
import { formatShortDate, weekdayOf } from "@/lib/date";
import type { DecisionDate } from "@/types/journal";

// 협의된 날짜는 하루로 안 끝나는 경우가 있고, 날마다 무엇이 있는지도 다르다.
// 그래서 날짜 하나에 내용 하나를 붙여 담는다. 내용은 비워둬도 된다.
// <input type="date">로는 한 번에 여러 날을 못 고르므로 한 줄씩 담고, 담긴 줄은 지울 수 있다.
// name을 주면 서버 액션이 formData.getAll(name)으로 읽도록 hidden input도 함께 낸다.
// 한 줄을 JSON 한 덩어리로 넣어야 날짜와 내용이 순서로만 짝지어지는 일을 피할 수 있다.

// Tailwind는 조립된 클래스명을 못 찾으므로 두 톤 모두 완성된 문자열로 둔다.
const TONE = {
  emerald: {
    input:
      "rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400",
    add: "rounded-md bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50",
    hint: "text-xs text-emerald-700",
  },
  plain: {
    input:
      "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
    add: "rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50",
    hint: "text-xs text-gray-400",
  },
} as const;

const ROW_CLASS =
  "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-emerald-50 px-2 py-1.5 text-sm text-emerald-900";

export default function DecisionDatesField({
  entries,
  onChange,
  tone = "plain",
  name,
  disabled = false,
}: {
  entries: DecisionDate[];
  onChange: (entries: DecisionDate[]) => void;
  tone?: keyof typeof TONE;
  name?: string;
  disabled?: boolean;
}) {
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const t = TONE[tone];

  function add() {
    if (!draftDate) return;
    // 시간은 선택이다. 안 고르면 빈 문자열로 두고 '하루 종일'처럼 다룬다.
    const entry = {
      date: draftDate,
      time: draftTime,
      content: draftContent.trim(),
    };
    // 이미 담은 날이면 새 줄을 만들지 않고 그 줄의 내용을 갈아끼운다.
    const next = entries.some((e) => e.date === entry.date)
      ? entries.map((e) => (e.date === entry.date ? entry : e))
      : [...entries, entry];
    onChange(next.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)));
    setDraftDate("");
    setDraftTime("");
    setDraftContent("");
  }

  return (
    <div className="space-y-1.5">
      {name &&
        entries.map((e) => (
          <input key={e.date} type="hidden" name={name} value={JSON.stringify(e)} />
        ))}

      {entries.length > 0 && (
        <ul className="space-y-1">
          {entries.map((e) => (
            <li key={e.date} className={ROW_CLASS}>
              <span className="font-medium">
                {formatShortDate(e.date)} ({weekdayOf(e.date)})
                {e.time && <span className="ml-1">{e.time}</span>}
              </span>
              <span className="min-w-0 flex-1 break-words">
                {e.content || <span className="text-emerald-600">내용 없음</span>}
              </span>
              <button
                type="button"
                onClick={() => onChange(entries.filter((x) => x.date !== e.date))}
                disabled={disabled}
                className="flex-shrink-0 text-xs text-emerald-600 hover:text-emerald-900"
              >
                빼기
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={draftDate}
          disabled={disabled}
          onChange={(e) => setDraftDate(e.target.value)}
          className={t.input}
        />
        <input
          type="time"
          value={draftTime}
          disabled={disabled}
          onChange={(e) => setDraftTime(e.target.value)}
          aria-label="시각 (선택)"
          className={t.input}
        />
        <input
          type="text"
          value={draftContent}
          disabled={disabled}
          onChange={(e) => setDraftContent(e.target.value)}
          placeholder="그날 일정 내용 (선택)"
          // 폼 안에서 Enter를 누르면 일지 전체가 저장돼버리므로 여기서 가로챈다.
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={`min-w-0 flex-1 ${t.input}`}
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !draftDate}
          className={t.add}
        >
          날짜 추가
        </button>
      </div>

      {entries.length === 0 && (
        <p className={t.hint}>
          선택 — 넣으면 그 날짜마다 캘린더에 표시됩니다. 시각은 안 골라도 됩니다
        </p>
      )}
    </div>
  );
}
