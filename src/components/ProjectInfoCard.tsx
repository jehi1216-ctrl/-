"use client";

import { useState, useTransition } from "react";
import ProjectForm from "./ProjectForm";
import PhaseSelect from "./PhaseSelect";
import { updateProject, deleteProject } from "@/app/(main)/projects/actions";
import { buildingCoverageRatio, floorAreaRatio, type Project } from "@/types/project";

function formatArea(value: number): string {
  return `${value.toLocaleString()}m²`;
}

function formatRatio(value: number): string {
  return `${value.toFixed(2)}%`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 flex-shrink-0 text-gray-400">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  );
}

export default function ProjectInfoCard({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const boundUpdate = updateProject.bind(null, project.id);
  const coverageRatio = buildingCoverageRatio(project);
  const floorRatio = floorAreaRatio(project);

  function handleDelete() {
    if (
      !confirm(
        "이 프로젝트를 삭제할까요? 협력업체, 문서, 업무 기록이 모두 함께 삭제됩니다."
      )
    ) {
      return;
    }
    startTransition(() => deleteProject(project.id));
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <ProjectForm action={boundUpdate} defaultValues={project} submitLabel="정보 저장" />
        <div className="flex items-center justify-between">
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-gray-500 hover:underline"
          >
            닫기
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm text-red-500 hover:underline disabled:opacity-60"
          >
            프로젝트 삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <PhaseSelect projectId={project.id} phase={project.phase} />
          </div>
          {project.client && (
            <p className="mt-1 text-sm text-gray-500">발주처 {project.client}</p>
          )}
          {project.site_address && (
            <p className="text-sm text-gray-500">{project.site_address}</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          수정
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {project.start_date && <InfoRow label="시작일" value={project.start_date} />}
        {project.expected_completion_date && (
          <InfoRow label="준공예정일" value={project.expected_completion_date} />
        )}
        {project.site_area != null && (
          <InfoRow label="대지면적" value={formatArea(project.site_area)} />
        )}
        {project.building_area != null && (
          <InfoRow label="건축면적" value={formatArea(project.building_area)} />
        )}
        {project.total_floor_area != null && (
          <InfoRow label="연면적" value={formatArea(project.total_floor_area)} />
        )}
        {coverageRatio != null && (
          <InfoRow label="건폐율" value={formatRatio(coverageRatio)} />
        )}
        {floorRatio != null && (
          <InfoRow label="용적률" value={formatRatio(floorRatio)} />
        )}
        {project.contract_amount != null && (
          <InfoRow
            label="공사금액"
            value={`${project.contract_amount.toLocaleString()}원`}
          />
        )}
        {project.contract_info && (
          <InfoRow label="계약정보" value={project.contract_info} />
        )}
        {project.manager_name && (
          <InfoRow
            label="담당자"
            value={
              project.manager_phone
                ? `${project.manager_name} (${project.manager_phone})`
                : project.manager_name
            }
          />
        )}
      </dl>
    </div>
  );
}
