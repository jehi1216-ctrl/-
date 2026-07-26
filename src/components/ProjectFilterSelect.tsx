"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import type { Project } from "@/types/project";

export default function ProjectFilterSelect({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("project", e.target.value);
    } else {
      params.delete("project");
    }
    router.push(`/journal?${params.toString()}`);
  }

  return (
    <select
      onChange={handleChange}
      defaultValue={searchParams.get("project") ?? ""}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
    >
      <option value="">전체 프로젝트</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
