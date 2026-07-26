import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel } from "@/lib/date";
import JournalEntryCard from "@/components/JournalEntryCard";
import ProjectFilterSelect from "@/components/ProjectFilterSelect";
import {
  CATEGORY_OPTIONS,
  REVIEW_SUBOPTIONS,
  DESIGN_SUBOPTIONS,
  PERMIT_DISCIPLINES,
  PERMIT_STAGES,
  CONSULT_SUBOPTIONS,
  type WorkLog,
} from "@/types/journal";
import type { Project, ProjectFile } from "@/types/project";

function groupByDate(logs: WorkLog[]) {
  const groups = new Map<string, WorkLog[]>();
  for (const log of logs) {
    const bucket = groups.get(log.date) ?? [];
    bucket.push(log);
    groups.set(log.date, bucket);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
}

const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  검토: [...REVIEW_SUBOPTIONS],
  설계: [...DESIGN_SUBOPTIONS],
  대관: PERMIT_DISCIPLINES.flatMap((d) => PERMIT_STAGES.map((s) => `${d}-${s}`)),
  협의: [...CONSULT_SUBOPTIONS],
};

function getSubValues(log: WorkLog, category: string): string[] {
  if (category === "협의") return log.category_details?.협의_sub ?? [];
  if (category === "검토" || category === "설계" || category === "대관") {
    return log.category_details?.[category] ?? [];
  }
  return [];
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sub?: string;
    project?: string;
    date?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    category: activeCategory,
    sub: activeSub,
    project: activeProject,
    date: activeDate,
  } = await searchParams;

  function buildHref(overrides: {
    category?: string;
    sub?: string;
    project?: string;
    date?: string;
  }) {
    const params = new URLSearchParams();
    const next = {
      category: activeCategory,
      sub: activeSub,
      project: activeProject,
      date: activeDate,
      ...overrides,
    };
    if (next.category) params.set("category", next.category);
    if (next.sub) params.set("sub", next.sub);
    if (next.project) params.set("project", next.project);
    if (next.date) params.set("date", next.date);
    const qs = params.toString();
    return qs ? `/journal?${qs}` : "/journal";
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const projectList = (projects ?? []) as Project[];
  const projectNameById = new Map(projectList.map((p) => [p.id, p.name]));

  let query = supabase
    .from("work_logs")
    .select("*")
    .eq("user_id", user!.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (activeCategory) {
    query = query.contains("categories", [activeCategory]);
  }
  if (activeProject) {
    query = query.eq("project_id", activeProject);
  }
  if (activeDate) {
    query = query.eq("date", activeDate);
  }

  const { data: logs } = await query;
  let allLogs = (logs ?? []) as WorkLog[];

  if (activeSub && activeCategory && SUBCATEGORY_OPTIONS[activeCategory]) {
    allLogs = allLogs.filter((log) => getSubValues(log, activeCategory).includes(activeSub));
  }

  const grouped = groupByDate(allLogs);

  const logIds = allLogs.map((l) => l.id);
  const filesByLog = new Map<string, ProjectFile[]>();
  if (logIds.length > 0) {
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .in("work_log_id", logIds);
    for (const f of (files ?? []) as ProjectFile[]) {
      if (!f.work_log_id) continue;
      const bucket = filesByLog.get(f.work_log_id) ?? [];
      bucket.push(f);
      filesByLog.set(f.work_log_id, bucket);
    }
  }

  const subOptions = activeCategory ? SUBCATEGORY_OPTIONS[activeCategory] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">전체 업무 일지</h1>
        <p className="text-sm text-gray-500">
          날짜별로 모아 볼 수 있어요.
        </p>
        {activeDate && (
          <p className="mt-1 text-sm text-brand-700">
            {formatDateLabel(activeDate)} 필터링 중 ·{" "}
            <Link href={buildHref({ date: undefined })} className="underline">
              해제
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildHref({ category: undefined, sub: undefined })}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            !activeCategory
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </Link>
        {CATEGORY_OPTIONS.map((category) => (
          <Link
            key={category}
            href={buildHref({ category, sub: undefined })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeCategory === category
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {category}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <ProjectFilterSelect projects={projectList} />
      </div>

      {subOptions && (
        <div className="flex flex-wrap items-center gap-2 pl-1">
          <span className="text-xs text-gray-400">{activeCategory} 세부:</span>
          <Link
            href={buildHref({ sub: undefined })}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              !activeSub
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            전체
          </Link>
          {subOptions.map((sub) => (
            <Link
              key={sub}
              href={buildHref({ sub })}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                activeSub === sub
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {sub}
            </Link>
          ))}
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          조건에 맞는 업무 일지가 없어요.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, dayLogs]) => (
            <section key={date}>
              <h2 className="mb-2 text-sm font-medium text-gray-500">
                {formatDateLabel(date)} · {dayLogs.length}건
              </h2>
              <ul className="space-y-3">
                {dayLogs.map((log) => (
                  <JournalEntryCard
                    key={log.id}
                    log={log}
                    projectName={projectNameById.get(log.project_id)}
                    files={filesByLog.get(log.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
