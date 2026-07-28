"use client";

import { BUILD_CATEGORY_OPTIONS } from "@/types/journal";

const chipClass =
  "flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700";

export default function BuildCategoryFieldset({
  selectedCategories,
  onToggle,
}: {
  selectedCategories: string[];
  onToggle: (c: string) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium">공사 카테고리</span>
      <div className="flex flex-wrap gap-2">
        {BUILD_CATEGORY_OPTIONS.map((c) => (
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
    </div>
  );
}
