"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKST } from "@/lib/date";
import { NUMBERED_CATEGORIES, type CategoryDetails, type JournalStatus } from "@/types/journal";
import type { FormState } from "./formState";

const NUMBERED_FIELD_NAME: Record<(typeof NUMBERED_CATEGORIES)[number], string> = {
  협의: "consult_title",
  PT: "pt_title",
  공사: "construction_title",
  브랜딩: "branding_title",
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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

    const title = String(formData.get(NUMBERED_FIELD_NAME[cat]) ?? "").trim();
    if (!title) {
      return { error: `${cat} 제목을 입력해주세요.` };
    }

    const existingEntry = existing?.categories.includes(cat)
      ? existing.category_details[cat]
      : undefined;

    if (existingEntry) {
      category_details[cat] = { seq: existingEntry.seq, title };
    } else {
      const { count } = await supabase
        .from("work_logs")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .contains("categories", [cat]);

      category_details[cat] = { seq: (count ?? 0) + 1, title };
    }
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
  const categories = formData.getAll("categories").map((c) => String(c));
  const status = String(formData.get("status") ?? "in_progress") as JournalStatus;
  const date = String(formData.get("date") ?? todayKST());

  if (!project_id) {
    return { error: "프로젝트를 선택해주세요.", success: false };
  }
  if (!content) {
    return { error: "내용을 입력해주세요.", success: false };
  }
  if (categories.length === 0) {
    return { error: "카테고리를 하나 이상 선택해주세요.", success: false };
  }

  const parsed = await buildCategoryDetails(supabase, formData, categories, project_id);
  if ("error" in parsed) {
    return { error: parsed.error, success: false };
  }

  const { error } = await supabase.from("work_logs").insert({
    user_id: user.id,
    project_id,
    date,
    content,
    categories,
    category_details: parsed.details,
    status,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
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
  const categories = formData.getAll("categories").map((c) => String(c));
  const status = String(formData.get("status") ?? "in_progress") as JournalStatus;

  if (!content) {
    return { error: "내용을 입력해주세요.", success: false };
  }
  if (categories.length === 0) {
    return { error: "카테고리를 하나 이상 선택해주세요.", success: false };
  }

  const parsed = await buildCategoryDetails(
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
      categories,
      category_details: parsed.details,
      status,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/journal");
  revalidatePath(`/projects/${existing.project_id}`);
  return { error: null, success: true, submittedAt: Date.now() };
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
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);
}
