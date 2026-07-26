"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addChecklistItem(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const assignee = String(formData.get("assignee") ?? "").trim() || null;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;

  await supabase.from("project_checklist_items").insert({
    project_id: projectId,
    user_id: user.id,
    content,
    assignee,
    due_date,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function toggleChecklistItem(
  projectId: string,
  itemId: string,
  isDone: boolean
) {
  const supabase = await createClient();
  await supabase
    .from("project_checklist_items")
    .update({ is_done: isDone })
    .eq("id", itemId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteChecklistItem(projectId: string, itemId: string) {
  const supabase = await createClient();
  await supabase.from("project_checklist_items").delete().eq("id", itemId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}
