"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKST } from "@/lib/date";
import {
  NUMBERED_CATEGORIES,
  CONSULT_NUMBERED_FIELD,
  type CategoryDetails,
  parseDecisionDates,
  type DecisionDate,
  type JournalStatus,
  type LogType,
} from "@/types/journal";
import type { FormState } from "./formState";

const NUMBERED_FIELD_NAME: Record<(typeof NUMBERED_CATEGORIES)[number], string> = {
  협의: "consult_title",
  PT: "pt_title",
  브랜딩: "branding_title",
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// 다음 회차 번호. **이미 번호를 받은 일지의 최댓값 +1**로 뽑는다.
// 협의는 굵직한 안건만 번호를 받으므로 '협의 태그가 붙은 일지 수'로 세면
// 번호 없는 일지까지 자리를 차지해 번호가 건너뛴다. seq는 jsonb 안에 있어
// 범위 질의가 안 되니 그 프로젝트 것만 읽어 JS에서 고른다.
async function nextSeq(
  supabase: SupabaseServerClient,
  cat: (typeof NUMBERED_CATEGORIES)[number],
  projectId: string
): Promise<number> {
  const { data } = await supabase
    .from("work_logs")
    .select("category_details")
    .eq("project_id", projectId)
    .contains("categories", [cat]);

  let max = 0;
  for (const row of (data ?? []) as { category_details: CategoryDetails | null }[]) {
    const seq = row.category_details?.[cat]?.seq;
    if (typeof seq === "number" && seq > max) max = seq;
  }
  return max + 1;
}

async function buildCategoryDetails(
  supabase: SupabaseServerClient,
  formData: FormData,
  categories: string[],
  projectId: string,
  existing?: { categories: string[]; category_details: CategoryDetails }
): Promise<{ error: string } | { details: CategoryDetails }> {
  const category_details: CategoryDetails = {};

  if (categories.includes("검토")) {
    category_details.검토 = formData.getAll("review_sub").map(String);
  }
  if (categories.includes("설계")) {
    category_details.설계 = formData.getAll("design_sub").map(String);
  }
  if (categories.includes("대관")) {
    category_details.대관 = formData.getAll("permit_sub").map(String);
  }
  if (categories.includes("협의")) {
    category_details.협의_sub = formData.getAll("consult_sub").map(String);
  }

  for (const cat of NUMBERED_CATEGORIES) {
    if (!categories.includes(cat)) continue;
    // 협의만 옵트인이다 — 체크를 안 하면 제목도 번호도 없이 협의 태그만 남는다.
    if (cat === "협의" && formData.get(CONSULT_NUMBERED_FIELD) === null) continue;

    const title = String(formData.get(NUMBERED_FIELD_NAME[cat]) ?? "").trim();
    if (!title) {
      return { error: `${cat} 제목을 입력해주세요.` };
    }

    const existingEntry = existing?.categories.includes(cat)
      ? existing.category_details[cat]
      : undefined;

    // 이미 번호를 받은 건이면 그 번호를 지킨다. 수정하다 번호가 바뀌면 안 된다.
    category_details[cat] = {
      seq: existingEntry?.seq ?? (await nextSeq(supabase, cat, projectId)),
      title,
    };
  }

  return { details: category_details };
}

export async function createLog(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다.", success: false };
  }

  const project_id = String(formData.get("project_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const result = String(formData.get("result") ?? "").trim();
  const categories = formData.getAll("categories").map((c) => String(c));
  const status = String(formData.get("status") ?? "todo") as JournalStatus;
  const next_action = String(formData.get("next_action") ?? "").trim();
  const next_action_date = String(formData.get("next_action_date") ?? "").trim();
  const next_action_time = String(formData.get("next_action_time") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  // 줄마다 {date, content} JSON 한 덩어리로 들어온다. 손상된 값은 버리고 나머지를 살린다.
  const decision_dates = parseDecisionDates(
    formData.getAll("decision_dates").flatMap((raw) => {
      try {
        return [JSON.parse(String(raw))];
      } catch {
        return [];
      }
    })
  );
  const date = String(formData.get("date") ?? todayKST());
  const log_type = String(formData.get("log_type") ?? "design") as LogType;

  if (!project_id) {
    return { error: "프로젝트를 선택해주세요.", success: false };
  }
  if (!content) {
    return { error: "내용을 입력해주세요.", success: false };
  }
  if (categories.length === 0) {
    return { error: "카테고리를 하나 이상 선택해주세요.", success: false };
  }

  const parsed =
    log_type === "design"
      ? await buildCategoryDetails(supabase, formData, categories, project_id)
      : { details: {} as CategoryDetails };
  if ("error" in parsed) {
    return { error: parsed.error, success: false };
  }

  const { error } = await supabase.from("work_logs").insert({
    user_id: user.id,
    project_id,
    date,
    log_type,
    content,
    // result는 이제 답변 대기 코멘트칸 하나만 쓴다 (폼의 결과칸은 없앴다).
    result: status === "waiting" ? result || null : null,
    categories,
    category_details: parsed.details,
    status,
    next_action: status === "todo" ? next_action || null : null,
    next_action_date: status === "todo" ? next_action_date || null : null,
    next_action_time: status === "todo" ? next_action_time || null : null,
    decision: status === "done" ? decision || null : null,
    decision_dates:
      status === "done" && decision_dates.length > 0 ? decision_dates : null,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
  revalidatePath(`/projects/${project_id}`);
  return { error: null, success: true, submittedAt: Date.now() };
}

export async function updateLog(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("work_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    return { error: "기록을 찾을 수 없습니다.", success: false };
  }

  const content = String(formData.get("content") ?? "").trim();
  const result = String(formData.get("result") ?? "").trim();
  const categories = formData.getAll("categories").map((c) => String(c));
  const status = String(formData.get("status") ?? "todo") as JournalStatus;
  const next_action = String(formData.get("next_action") ?? "").trim();
  const next_action_date = String(formData.get("next_action_date") ?? "").trim();
  const next_action_time = String(formData.get("next_action_time") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  // 줄마다 {date, content} JSON 한 덩어리로 들어온다. 손상된 값은 버리고 나머지를 살린다.
  const decision_dates = parseDecisionDates(
    formData.getAll("decision_dates").flatMap((raw) => {
      try {
        return [JSON.parse(String(raw))];
      } catch {
        return [];
      }
    })
  );

  if (!content) {
    return { error: "내용을 입력해주세요.", success: false };
  }
  if (categories.length === 0) {
    return { error: "카테고리를 하나 이상 선택해주세요.", success: false };
  }

  const parsed: { error: string } | { details: CategoryDetails } =
    existing.log_type === "build"
      ? { details: {} }
      : await buildCategoryDetails(
          supabase,
          formData,
          categories,
          existing.project_id,
          {
            categories: (existing.categories ?? []) as string[],
            category_details: (existing.category_details ?? {}) as CategoryDetails,
          }
        );
  if ("error" in parsed) {
    return { error: parsed.error, success: false };
  }

  const { error } = await supabase
    .from("work_logs")
    .update({
      content,
      // 답변 대기일 때만 코멘트칸이 뜨므로 그때만 쓴다. 다른 상태에서는 손대지 않는다 —
      // 폼에 결과칸이 없던 시절 적어둔 텍스트를 안 보이는 채로 지워버리면 안 된다
      // (closeLog이 결정사항을 비우지 않고 두는 것과 같은 이유).
      ...(status === "waiting" ? { result: result || null } : {}),
      categories,
      category_details: parsed.details,
      status,
      next_action: status === "todo" ? next_action || null : null,
      next_action_date: status === "todo" ? next_action_date || null : null,
      next_action_time: status === "todo" ? next_action_time || null : null,
      decision: status === "done" ? decision || null : null,
      decision_dates:
        status === "done" && decision_dates.length > 0 ? decision_dates : null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
  revalidatePath(`/projects/${existing.project_id}`);
  return { error: null, success: true, submittedAt: Date.now() };
}

// 캘린더에서 할 일 문구와 날짜만 바로 고칠 때 쓴다(일지 전체 수정 폼을 열지 않는다).
// 날짜를 비우면 캘린더에서는 사라지고 모아보기에만 남는다.
export async function updateNextAction(
  id: string,
  nextAction: string,
  nextActionDate: string,
  nextActionTime = ""
) {
  const trimmed = nextAction.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("work_logs")
    .update({
      next_action: trimmed,
      next_action_date: nextActionDate || null,
      // 날짜를 비우면 시각만 남을 자리가 없다. 같이 털어낸다.
      next_action_time: nextActionDate ? nextActionTime || null : null,
    })
    .eq("id", id)
    .select("project_id")
    .single();
  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);
}

// 종료 전용. 결정사항이나 협의된 날짜를 비워서 부르면 '그냥 종료'이고, 이때 기존 값은
// 지우지 않는다(상태를 되돌렸다가 다시 종료해도 적어둔 내용이 살아남는다).
// 그래서 적어둔 값을 지우는 건 여기가 아니라 수정 폼(updateLog)에서만 된다.
export async function closeLog(
  id: string,
  decision: string,
  decisionDates: DecisionDate[] = []
) {
  const supabase = await createClient();
  const trimmed = decision.trim();
  const dates = parseDecisionDates(decisionDates);
  const patch: {
    status: JournalStatus;
    decision?: string;
    decision_dates?: DecisionDate[];
  } = { status: "done" };
  if (trimmed) patch.decision = trimmed;
  if (dates.length > 0) patch.decision_dates = dates;
  const { data } = await supabase
    .from("work_logs")
    .update(patch)
    .eq("id", id)
    .select("project_id")
    .single();
  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);
}

export async function updateLogStatus(id: string, status: JournalStatus) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_logs")
    .update({ status })
    .eq("id", id)
    .select("project_id")
    .single();
  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);
}

export async function deleteLog(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_logs")
    .delete()
    .eq("id", id)
    .select("project_id")
    .single();
  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);
}
