"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/(main)/dashboard/formState";
import { CHECKLIST_STATUS_OPTIONS, type ChecklistStatus } from "@/types/project";

export async function addChecklistItem(
  projectId: string,
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

  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    return { error: "할 일 내용을 입력해주세요.", success: false };
  }

  const assignee_contact_id = String(formData.get("assignee_contact_id") ?? "").trim() || null;
  const statusInput = String(formData.get("status") ?? "준비");
  const status = (
    CHECKLIST_STATUS_OPTIONS as readonly string[]
  ).includes(statusInput)
    ? (statusInput as ChecklistStatus)
    : "준비";

  const { error } = await supabase.from("project_checklist_items").insert({
    project_id: projectId,
    user_id: user.id,
    content,
    assignee_contact_id,
    status,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/checklist");
  return { error: null, success: true, submittedAt: Date.now() };
}

export async function updateChecklistItem(
  projectId: string,
  itemId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const assignee_contact_id = String(formData.get("assignee_contact_id") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  const { error } = await supabase
    .from("project_checklist_items")
    .update({ content, assignee_contact_id, note })
    .eq("id", itemId);

  if (error) console.error("updateChecklistItem failed:", error.message);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/checklist");
}

export async function updateChecklistItemStatus(
  projectId: string,
  itemId: string,
  status: ChecklistStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_checklist_items")
    .update({ status })
    .eq("id", itemId);

  if (error) console.error("updateChecklistItemStatus failed:", error.message);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/checklist");
}

export async function deleteChecklistItem(projectId: string, itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_checklist_items").delete().eq("id", itemId);
  if (error) console.error("deleteChecklistItem failed:", error.message);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/checklist");
}
