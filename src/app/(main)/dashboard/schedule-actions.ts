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
  if (!date || !content) return;

  await supabase.from("schedule_items").insert({
    user_id: user.id,
    date,
    content,
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function toggleScheduleItem(id: string, isDone: boolean) {
  const supabase = await createClient();
  await supabase.from("schedule_items").update({ is_done: isDone }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function deleteScheduleItem(id: string) {
  const supabase = await createClient();
  await supabase.from("schedule_items").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}
