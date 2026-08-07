"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/(main)/dashboard/formState";
import {
  CHECKLIST_STATUS_OPTIONS,
  ME_ASSIGNEE,
  ME_OPTION_VALUE,
  type ChecklistStatus,
} from "@/types/project";

function revalidateChecklist(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/checklist");
}

export async function addChecklistGroup(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("project_checklist_groups").insert({
    project_id: projectId,
    user_id: user.id,
    name,
  });
  if (error) console.error("addChecklistGroup failed:", error.message);

  revalidateChecklist(projectId);
}

export async function renameChecklistGroup(
  projectId: string,
  groupId: string,
  name: string
) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_checklist_groups")
    .update({ name: trimmed })
    .eq("id", groupId);
  if (error) console.error("renameChecklistGroup failed:", error.message);

  revalidateChecklist(projectId);
}

// 폴더만 지운다. 담겨 있던 항목은 group_id가 null이 되어 '폴더 없음'으로 남는다.
export async function deleteChecklistGroup(projectId: string, groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_checklist_groups")
    .delete()
    .eq("id", groupId);
  if (error) console.error("deleteChecklistGroup failed:", error.message);

  revalidateChecklist(projectId);
}

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

  const assigneeChoice = String(formData.get("assignee_contact_id") ?? "").trim();
  const isMe = assigneeChoice === ME_OPTION_VALUE;
  const assignee_contact_id = isMe ? null : assigneeChoice || null;
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
    group_id: String(formData.get("group_id") ?? "").trim() || null,
    assignee_contact_id,
    assignee: isMe ? ME_ASSIGNEE : null,
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

  const assigneeChoice = String(formData.get("assignee_contact_id") ?? "").trim();
  const isMe = assigneeChoice === ME_OPTION_VALUE;
  const assignee_contact_id = isMe ? null : assigneeChoice || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  // 담당자를 '나'에서 다른 값으로 바꾸면 '나' 표시는 지운다. 다만 마이그레이션 이전에
  // 자유 입력으로 들어간 이름은 폼에 보이지 않으므로 임의로 지우지 않고 그대로 둔다.
  const prevAssignee = String(formData.get("prev_assignee") ?? "").trim();
  const assignee = isMe
    ? ME_ASSIGNEE
    : prevAssignee === ME_ASSIGNEE
      ? null
      : prevAssignee || null;

  const { error } = await supabase
    .from("project_checklist_items")
    .update({
      content,
      group_id: String(formData.get("group_id") ?? "").trim() || null,
      assignee_contact_id,
      assignee,
      note,
    })
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
