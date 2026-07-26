import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PHASE_LABEL, PHASE_BADGE_CLASS, type Project } from "@/types/project";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (projects ?? []) as Project[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">프로젝트(현장)</h1>
          <p className="text-sm text-gray-500">진행 중인 현장을 관리하세요.</p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          새 프로젝트
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          등록된 프로젝트가 없어요.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
