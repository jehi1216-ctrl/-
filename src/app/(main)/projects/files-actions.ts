"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  uploadToDropbox,
  getDropboxTemporaryLink,
  deleteFromDropbox,
} from "@/lib/dropbox/client";

function revalidateFileViews(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/journal");
}

export async function uploadProjectFile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const file = formData.get("file") as File | null;
  const projectId = String(formData.get("project_id") ?? "").trim();
  const workLogId = String(formData.get("work_log_id") ?? "").trim() || null;

  if (!file || !projectId) {
    return { error: "파일과 프로젝트 정보가 필요합니다." };
  }

  const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_");
  const path = `/${user.id}/${projectId}/${Date.now()}_${safeName}`;

  try {
    await uploadToDropbox(path, file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "업로드에 실패했습니다." };
  }

  const { error: insertError } = await supabase.from("project_files").insert({
    project_id: projectId,
    work_log_id: workLogId,
    user_id: user.id,
    file_path: path,
    file_name: file.name,
    file_type: file.type || null,
    file_size: file.size,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidateFileViews(projectId);
  return { error: null };
}

export async function getProjectFileLink(fileId: string) {
  const supabase = await createClient();
  const { data: file, error } = await supabase
    .from("project_files")
    .select("file_path")
    .eq("id", fileId)
    .single();

  if (error || !file) {
    return { error: "파일을 찾을 수 없습니다.", url: null };
  }

  try {
    const url = await getDropboxTemporaryLink(file.file_path);
    return { error: null, url };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "다운로드 링크 생성에 실패했습니다.",
      url: null,
    };
  }
}

export async function deleteProjectFile(
  fileId: string,
  filePath: string,
  projectId: string
) {
  const supabase = await createClient();

  try {
    await deleteFromDropbox(filePath);
  } catch {
    // Dropbox에 이미 없는 파일이어도 DB 레코드는 정리한다.
  }

  await supabase.from("project_files").delete().eq("id", fileId);
  revalidateFileViews(projectId);
}
