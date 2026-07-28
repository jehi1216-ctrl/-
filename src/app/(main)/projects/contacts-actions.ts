"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addContact(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const company = String(formData.get("company") ?? "").trim();
  if (!company) return;

  const trade = String(formData.get("trade") ?? "").trim() || null;
  const contact_name = String(formData.get("contact_name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  await supabase.from("project_contacts").insert({
    project_id: projectId,
    user_id: user.id,
    company,
    trade,
    contact_name,
    phone,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/checklist");
}

export async function updateContact(
  projectId: string,
  contactId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const company = String(formData.get("company") ?? "").trim();
  if (!company) return;

  const trade = String(formData.get("trade") ?? "").trim() || null;
  const contact_name = String(formData.get("contact_name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  await supabase
    .from("project_contacts")
    .update({ company, trade, contact_name, phone })
    .eq("id", contactId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/checklist");
}

export async function deleteContact(projectId: string, contactId: string) {
  const supabase = await createClient();
  await supabase.from("project_contacts").delete().eq("id", contactId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/checklist");
}
