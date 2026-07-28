"use client";

import {
  CATEGORY_OPTIONS,
  REVIEW_SUBOPTIONS,
  DESIGN_SUBOPTIONS,
  PERMIT_DISCIPLINES,
  PERMIT_STAGES,
  CONSULT_SUBOPTIONS,
  NUMBERED_CATEGORIES,
  type CategoryDetails,
} from "@/types/journal";

export const NUMBERED_FIELD_NAME: Record<
  (typeof NUMBERED_CATEGORIES)[number],
  string
> = {
  협의: "consult_title",
  PT: "pt_title",
  브랜딩: "branding_title",
};

const chipClass =
  "flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700";
const subInputClass =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default function CategoryFieldset({
  selectedCategories,
  onToggle,
  defaultDetails,
}: {
  selectedCategories: string[];
  onToggle: (c: string) => void;
  defaultDetails?: CategoryDetails;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium">카테고리</span>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((c) => (
          <label key={c} className={chipClass}>
            <input
              type="checkbox"
              name="categories"
              value={c}
              checked={selectedCategories.includes(c)}
              onChange={() => onToggle(c)}
              className="accent-brand-600"
            />
            {c}
          </label>
        ))}
      </div>

      <div className="mt-2 space-y-3">
        {selectedCategories.includes("검토") && (
          <div className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
            <p className="mb-1.5 text-xs font-medium text-gray-500">검토 세부</p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_SUBOPTIONS.map((s) => (
                <label key={s} className={chipClass}>
                  <input
                    type="checkbox"
                    name="review_sub"
                    value={s}
                    defaultChecked={defaultDetails?.검토?.includes(s)}
                    className="accent-brand-600"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedCategories.includes("설계") && (
          <div className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
            <p className="mb-1.5 text-xs font-medium text-gray-500">설계 세부</p>
            <div className="flex flex-wrap gap-2">
              {DESIGN_SUBOPTIONS.map((s) => (
                <label key={s} className={chipClass}>
                  <input
                    type="checkbox"
                    name="design_sub"
                    value={s}
                    defaultChecked={defaultDetails?.설계?.includes(s)}
                    className="accent-brand-600"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedCategories.includes("대관") && (
          <div className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              대관 세부 (공종 · 단계)
            </p>
            <div className="space-y-1.5">
              {PERMIT_DISCIPLINES.map((discipline) => (
                <div key={discipline} className="flex flex-wrap items-center gap-2">
                  <span className="w-10 flex-shrink-0 text-xs text-gray-400">
                    {discipline}
                  </span>
                  {PERMIT_STAGES.map((stage) => {
                    const value = `${discipline}-${stage}`;
                    return (
                      <label key={stage} className={chipClass}>
                        <input
                          type="checkbox"
                          name="permit_sub"
                          value={value}
                          defaultChecked={defaultDetails?.대관?.includes(value)}
                          className="accent-brand-600"
                        />
                        {stage}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCategories.includes("협의") && (
          <div className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
            <p className="mb-1.5 text-xs font-medium text-gray-500">협의 세부</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {CONSULT_SUBOPTIONS.map((s) => (
                <label key={s} className={chipClass}>
                  <input
                    type="checkbox"
                    name="consult_sub"
                    value={s}
                    defaultChecked={defaultDetails?.협의_sub?.includes(s)}
                    className="accent-brand-600"
                  />
                  {s}
                </label>
              ))}
            </div>
            <label
              htmlFor={NUMBERED_FIELD_NAME.협의}
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              협의 제목 (자동으로 회차 번호가 붙습니다)
            </label>
            <input
              id={NUMBERED_FIELD_NAME.협의}
              name={NUMBERED_FIELD_NAME.협의}
              required
              defaultValue={defaultDetails?.협의?.title}
              placeholder="예: 협의 관련 제목"
              className={subInputClass}
            />
          </div>
        )}

        {NUMBERED_CATEGORIES.filter((cat) => cat !== "협의").map(
          (cat) =>
            selectedCategories.includes(cat) && (
              <div key={cat} className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
                <label
                  htmlFor={NUMBERED_FIELD_NAME[cat]}
                  className="mb-1.5 block text-xs font-medium text-gray-500"
                >
                  {cat} 제목 (자동으로 회차 번호가 붙습니다)
                </label>
                <input
                  id={NUMBERED_FIELD_NAME[cat]}
                  name={NUMBERED_FIELD_NAME[cat]}
                  required
                  defaultValue={defaultDetails?.[cat]?.title}
                  placeholder={`예: ${cat} 관련 제목`}
                  className={subInputClass}
                />
              </div>
            )
        )}
      </div>
    </div>
  );
}
