"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 일정은 프로젝트 상세의 캘린더에도 나오므로, 현장이 붙어 있으면 그 페이지도 같이 새로 고친다.
function revalidateAll(...projectIds: (string | null | undefined)[]) {
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/weekly");
  for (const projectId of new Set(projectIds.filter(Boolean))) {
    revalidatePath(`/projects/${projectId}`);
  }
}

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

  revalidateAll(project_id);
}

export async function toggleScheduleItem(id: string, isDone: boolean) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schedule_items")
    .update({ is_done: isDone })
    .eq("id", id)
    .select("project_id")
    .single();
  revalidateAll(data?.project_id);
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
  // 현장을 옮기면 떠나온 프로젝트 화면도 낡는다. 바꾸기 전 현장을 먼저 읽어 둘 다 새로 고친다.
  const { data: before } = await supabase
    .from("schedule_items")
    .select("project_id")
    .eq("id", id)
    .single();
  await supabase
    .from("schedule_items")
    .update({ content: trimmed, date, project_id: projectId || null })
    .eq("id", id);
  revalidateAll(before?.project_id, projectId);
}

export async function deleteScheduleItem(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schedule_items")
    .delete()
    .eq("id", id)
    .select("project_id")
    .single();
  revalidateAll(data?.project_id);
}
