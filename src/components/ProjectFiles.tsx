"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  uploadProjectFile,
  getProjectFileLink,
  deleteProjectFile,
} from "@/app/(main)/projects/files-actions";
import type { ProjectFile } from "@/types/project";

function formatSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function ProjectFiles({
  projectId,
  workLogId,
  files,
  title = "문서함",
  compact = false,
}: {
  projectId: string;
  workLogId?: string;
  files: ProjectFile[];
  title?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("project_id", projectId);
    if (workLogId) formData.set("work_log_id", workLogId);

    const result = await uploadProjectFile(formData);
    setUploading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    if (photoInputRef.current) photoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function handleDownload(f: ProjectFile) {
    const { url, error: linkError } = await getProjectFileLink(f.id);

    if (linkError || !url) {
      setError(linkError ?? "다운로드 링크 생성에 실패했습니다.");
      return;
    }
    window.open(url, "_blank");
  }

  function handleDelete(f: ProjectFile) {
    startTransition(async () => {
      await deleteProjectFile(f.id, f.file_path, projectId);
      router.refresh();
    });
  }

  const content = (
    <>
      {!compact && <h2 className="mb-3 text-sm font-medium text-gray-500">{title}</h2>}

      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className={compact ? "mb-2 space-y-1" : "mb-3 space-y-2"}>
          {files.map((f) => (
            <li
              key={f.id}
              className={`flex items-center justify-between gap-2 rounded-md border border-gray-100 px-2 py-1 text-xs ${
                compact ? "" : "px-3 py-2 text-sm"
              } ${isPending ? "opacity-50" : ""}`}
            >
              <button
                onClick={() => handleDownload(f)}
                className="min-w-0 truncate text-left text-brand-700 hover:underline"
                title={f.file_name}
              >
                {f.file_name}
              </button>
              <div className="flex flex-shrink-0 items-center gap-2 text-gray-400">
                {!compact && <span>{formatSize(f.file_size)}</span>}
                <button
                  onClick={() => handleDelete(f)}
                  disabled={isPending}
                  className="hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <label
          className={`inline-block cursor-pointer rounded-md bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          {uploading ? "업로드 중..." : "사진 추가"}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <label
          className={`inline-block cursor-pointer rounded-md bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          {uploading ? "업로드 중..." : "파일 추가"}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
    </>
  );

  if (compact) {
    return <div className="mt-2 border-t border-gray-100 pt-2">{content}</div>;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      {content}
    </div>
  );
}
