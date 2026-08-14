"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";

export default function JournalSearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("q") ?? "";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = new FormData(e.currentTarget).get("q");
    const next = typeof raw === "string" ? raw.trim() : "";

    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("q", next);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.push(qs ? `/journal?${qs}` : "/journal");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {/* key={current} — '해제'로 q가 사라졌을 때 입력칸도 비워지도록.
          비제어 입력이라 defaultValue만으로는 이동해도 값이 그대로 남는다. */}
      <input
        key={current}
        type="search"
        name="q"
        defaultValue={current}
        placeholder="일지 내용 검색 (예: 양평 심의)"
        className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
      >
        검색
      </button>
    </form>
  );
}
