"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectFormState } from "./formState";
import type { ProjectPhase } from "@/types/project";

interface ProjectFields {
  name: string;
  client: string | null;
  site_address: string | null;
  phase: ProjectPhase;
  start_date: string | null;
  expected_completion_date: string | null;
  contract_amount: number | null;
  contract_info: string | null;
  manager_name: string | null;
  manager_phone: string | null;
}

type ReadFieldsResult =
  | { ok: true; fields: ProjectFields }
  | { ok: false; error: string };

function readProjectFields(formData: FormData): ReadFieldsResult {
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim() || null;
  const site_address = String(formData.get("site_address") ?? "").trim() || null;
  const phase = String(formData.get("phase") ?? "design") as ProjectPhase;
  const start_date = String(formData.get("start_date") ?? "").trim() || null;
  const expected_completion_date =
    String(formData.get("expected_completion_date") ?? "").trim() || null;
  const contractAmountRaw = String(formData.get("contract_amount") ?? "").trim();
  const contract_info = String(formData.get("contract_info") ?? "").trim() || null;
  const manager_name = String(formData.get("manager_name") ?? "").trim() || null;
  const manager_phone = String(formData.get("manager_phone") ?? "").trim() || null;

  let contract_amount: number | null = null;
  if (contractAmountRaw) {
    const parsed = Number(contractAmountRaw);
    if (Number.isNaN(parsed) || parsed < 0) {
      return { ok: false, error: "공사금액은 0 이상의 숫자여야 합니다." };
    }
    contract_amount = parsed;
  }

  if (!name) {
    return { ok: false, error: "프로젝트명을 입력해주세요." };
  }

  return {
    ok: true,
    fields: {
      name,
      client,
      site_address,
      phase,
      start_date,
      expected_completion_date,
      contract_amount,
      contract_info,
      manager_name,
      manager_phone,
    },
  };
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = readProjectFields(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, ...parsed.fields })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "프로젝트 생성에 실패했습니다." };
  }

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const supabase = await createClient();

  const parsed = readProjectFields(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const { error } = await supabase
    .from("projects")
    .update(parsed.fields)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return { error: null };
}

export async function updatePhase(id: string, phase: ProjectPhase) {
  const supabase = await createClient();
  await supabase.from("projects").update({ phase }).eq("id", id);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function updateProgressNotes(id: string, progress_notes: string) {
  const supabase = await createClient();
  await supabase.from("projects").update({ progress_notes }).eq("id", id);
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/projects");
  redirect("/projects");
}
