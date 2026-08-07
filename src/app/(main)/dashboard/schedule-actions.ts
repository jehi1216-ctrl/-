"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const date = String(formData.get("date") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const project_id = String(formData.get("project_id") ?? "").trim();
  if (!date || !content) return;

  await supabase.from("schedule_items").insert({
    user_id: user.id,
    date,
    content,
    project_id: project_id || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
}

export async function toggleScheduleItem(id: string, isDone: boolean) {
  const supabase = await createClient();
  await supabase.from("schedule_items").update({ is_done: isDone }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
}

// 캘린더에서 일정 내용/날짜/현장을 바로 고칠 때 쓴다. 날짜를 바꾸면 그 날짜 칸으로 옮겨간다.
export async function updateScheduleItem(
  id: string,
  content: string,
  date: string,
  projectId: string | null
) {
  const trimmed = content.trim();
  if (!trimmed || !date) return;

  const supabase = await createClient();
  await supabase
    .from("schedule_items")
    .update({ content: trimmed, date, project_id: projectId || null })
    .eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
}

export async function deleteScheduleItem(id: string) {
  const supabase = await createClient();
  await supabase.from("schedule_items").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
}
