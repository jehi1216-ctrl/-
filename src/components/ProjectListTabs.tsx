"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PHASE_LABEL,
  PHASE_BADGE_CLASS,
  PHASES_BY_TYPE,
  CHECKLIST_STATUS_OPTIONS,
  CHECKLIST_STATUS_BADGE_CLASS,
  NO_GROUP_LABEL,
  buildingCoverageRatio,
  floorAreaRatio,
  formatArea,
  formatRatio,
  type Project,
  type ChecklistGroup,
  type ChecklistItem,
  type ChecklistStatus,
} from "@/types/project";

// 미완료 항목을 폴더별로 묶는다. 항목이 하나도 안 남은 폴더는 아예 넣지 않는다.
// 폴더가 지워진 항목(group_id가 남아 있어도 폴더 목록에 없는 경우)은 '폴더 없음'으로 본다.
function folderSummary(items: ChecklistItem[], groups: ChecklistGroup[]) {
  const knownIds = new Set(groups.map((g) => g.id));
  const byGroup = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const key = item.group_id && knownIds.has(item.group_id) ? item.group_id : "";
    const bucket = byGroup.get(key) ?? [];
    bucket.push(item);
    byGroup.set(key, bucket);
  }

  const rows: { key: string; name: string; items: ChecklistItem[] }[] = [];
  for (const g of groups) {
    const bucket = byGroup.get(g.id);
    if (bucket?.length) rows.push({ key: g.id, name: g.name, items: bucket });
  }
  const ungrouped = byGroup.get("");
  if (ungrouped?.length) {
    rows.push({ key: "", name: NO_GROUP_LABEL, items: ungrouped });
  }
  return rows;
}

function statusCounts(items: ChecklistItem[]) {
  const counts = new Map<ChecklistStatus, number>();
  for (const item of items) {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  }
  return CHECKLIST_STATUS_OPTIONS.filter((s) => s !== "완료")
    .map((s) => ({ status: s, count: counts.get(s) ?? 0 }))
    .filter((c) => c.count > 0);
}

function areaSummary(p: Project): string | null {
  const parts: string[] = [];
  if (p.site_area != null) parts.push(`대지 ${formatArea(p.site_area)}`);
  if (p.building_area != null) parts.push(`건축 ${formatArea(p.building_area)}`);
  if (p.total_floor_area != null) parts.push(`연면적 ${formatArea(p.total_floor_area)}`);
  const coverage = buildingCoverageRatio(p);
  if (coverage != null) parts.push(`건폐율 ${formatRatio(coverage)}`);
  const floorRatio = floorAreaRatio(p);
  if (floorRatio != null) parts.push(`용적률 ${formatRatio(floorRatio)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
import {
  LOG_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  type LogType,
  type JournalStatus,
} from "@/types/journal";

// 카드에는 아직 안 끝난 일지(내가 할 일 / 답변 대기)만 건수로 보여준다.
const OPEN_LOG_STATUSES: JournalStatus[] = ["todo", "waiting"];

export default function ProjectListTabs({
  projects,
  checklistsByProject = {},
  groupsByProject = {},
  openLogCounts = {},
}: {
  projects: Project[];
  checklistsByProject?: Record<string, ChecklistItem[]>;
  groupsByProject?: Record<string, ChecklistGroup[]>;
  openLogCounts?: Record<string, Partial<Record<JournalStatus, number>>>;
}) {
  const [tab, setTab] = useState<LogType>("design");
  const filtered = projects.filter((p) => PHASES_BY_TYPE[tab].includes(p.phase));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200">
        {(["design", "build"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {LOG_TYPE_LABEL[t]} ({projects.filter((p) => PHASES_BY_TYPE[t].includes(p.phase)).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          해당하는 프로젝트가 없어요.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const area = areaSummary(p);
            const openItems = checklistsByProject[p.id] ?? [];
            const folders = folderSummary(openItems, groupsByProject[p.id] ?? []);
            const logCounts = OPEN_LOG_STATUSES.map((status) => ({
              status,
              count: openLogCounts[p.id]?.[status] ?? 0,
            })).filter((c) => c.count > 0);
            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-brand-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-medium">{p.name}</h2>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PHASE_BADGE_CLASS[p.phase]}`}
                    >
                      {PHASE_LABEL[p.phase]}
                    </span>
                  </div>
                  {(p.client || p.site_address) && (
                    <p className="mt-1 text-sm text-gray-500">
                      {[p.client, p.site_address].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {area && <p className="mt-1 text-xs text-gray-400">{area}</p>}
                  {logCounts.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="mr-0.5 text-xs text-gray-400">일지</span>
                      {logCounts.map(({ status, count }) => (
                        <span
                          key={status}
                          className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
                        >
                          {STATUS_LABEL[status]} {count}
                        </span>
                      ))}
                    </div>
                  )}
                  {folders.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                      {folders.map((folder) => (
                        <li
                          key={folder.key}
                          className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs"
                        >
                          <span className="min-w-0 truncate text-gray-600">
                            {folder.key ? `📁 ${folder.name}` : folder.name}
                            <span className="ml-1.5 text-gray-400">
                              {folder.items.length}
                            </span>
                          </span>
                          <span className="flex flex-shrink-0 flex-wrap gap-1">
                            {statusCounts(folder.items).map(({ status, count }) => (
                              <span
                                key={status}
                                className={`rounded-full px-1.5 py-0.5 font-medium ${CHECKLIST_STATUS_BADGE_CLASS[status]}`}
                              >
                                {status} {count}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
