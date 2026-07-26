"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PHASE_OPTIONS, PHASE_LABEL, type Project } from "@/types/project";
import type { ProjectFormState } from "@/app/(main)/projects/formState";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const labelClass = "mb-1 block text-sm font-medium";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

export default function ProjectForm({
  action,
  defaultValues,
  submitLabel = "저장",
}: {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  defaultValues?: Partial<Project>;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<ProjectFormState, FormData>(action, {
    error: null,
  });

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          프로젝트명 *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="예: OO빌딩 리모델링"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="client" className={labelClass}>
            발주처
          </label>
          <input
            id="client"
            name="client"
            defaultValue={defaultValues?.client ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="site_address" className={labelClass}>
            현장주소
          </label>
          <input
            id="site_address"
            name="site_address"
            defaultValue={defaultValues?.site_address ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="phase" className={labelClass}>
            공정단계
          </label>
          <select
            id="phase"
            name="phase"
            defaultValue={defaultValues?.phase ?? "design"}
            className={inputClass}
          >
            {PHASE_OPTIONS.map((phase) => (
              <option key={phase} value={phase}>
                {PHASE_LABEL[phase]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="start_date" className={labelClass}>
            시작일
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={defaultValues?.start_date ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="expected_completion_date" className={labelClass}>
            준공예정일
          </label>
          <input
            id="expected_completion_date"
            name="expected_completion_date"
            type="date"
            defaultValue={defaultValues?.expected_completion_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contract_amount" className={labelClass}>
            공사금액(원)
          </label>
          <input
            id="contract_amount"
            name="contract_amount"
            type="number"
            min={0}
            defaultValue={defaultValues?.contract_amount ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contract_info" className={labelClass}>
            계약정보
          </label>
          <input
            id="contract_info"
            name="contract_info"
            placeholder="계약번호, 조건 등"
            defaultValue={defaultValues?.contract_info ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="manager_name" className={labelClass}>
            담당자명
          </label>
          <input
            id="manager_name"
            name="manager_name"
            defaultValue={defaultValues?.manager_name ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="manager_phone" className={labelClass}>
            담당자 연락처
          </label>
          <input
            id="manager_phone"
            name="manager_phone"
            placeholder="010-0000-0000"
            defaultValue={defaultValues?.manager_phone ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
