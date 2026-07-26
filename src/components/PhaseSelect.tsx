"use client";

import { useTransition } from "react";
import { updatePhase } from "@/app/(main)/projects/actions";
import { PHASE_OPTIONS, PHASE_LABEL, PHASE_BADGE_CLASS, type ProjectPhase } from "@/types/project";

export default function PhaseSelect({
  projectId,
  phase,
}: {
  projectId: string;
  phase: ProjectPhase;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={phase}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => updatePhase(projectId, e.target.value as ProjectPhase))
      }
      className={`flex-shrink-0 rounded-full border-none px-2.5 py-1 text-xs font-medium disabled:opacity-60 ${PHASE_BADGE_CLASS[phase]}`}
    >
      {PHASE_OPTIONS.map((p) => (
        <option key={p} value={p}>
          {PHASE_LABEL[p]}
        </option>
      ))}
    </select>
  );
}
