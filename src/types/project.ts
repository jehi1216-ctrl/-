import type { LogType } from "./journal";

export type ProjectPhase =
  | "design"
  | "permit"
  | "construction"
  | "supervision"
  | "completed";

export const PHASES_BY_TYPE: Record<LogType, ProjectPhase[]> = {
  design: ["design", "permit"],
  build: ["construction", "supervision", "completed"],
};

export interface Project {
  id: string;
  user_id: string;
  name: string;
  client: string | null;
  site_address: string | null;
  phase: ProjectPhase;
  start_date: string | null;
  expected_completion_date: string | null;
  contract_amount: number | null;
  contract_info: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  progress_notes: string | null;
  site_area: number | null;
  building_area: number | null;
  total_floor_area: number | null;
  created_at: string;
}

/** 건폐율(%) = 건축면적 / 대지면적 * 100 */
export function buildingCoverageRatio(project: Pick<Project, "site_area" | "building_area">): number | null {
  if (!project.site_area || !project.building_area) return null;
  return (project.building_area / project.site_area) * 100;
}

/** 용적률(%) = 연면적 / 대지면적 * 100 */
export function floorAreaRatio(project: Pick<Project, "site_area" | "total_floor_area">): number | null {
  if (!project.site_area || !project.total_floor_area) return null;
  return (project.total_floor_area / project.site_area) * 100;
}

/** 1평 = 400/121 m² (정의값) */
const SQM_PER_PYEONG = 400 / 121;

export function formatArea(value: number): string {
  const pyeong = value / SQM_PER_PYEONG;
  return `${value.toLocaleString()}m² (${pyeong.toFixed(2)}평)`;
}

export function formatRatio(value: number): string {
  return `${value.toFixed(2)}%`;
}

export interface ProjectContact {
  id: string;
  project_id: string;
  user_id: string;
  trade: string | null;
  company: string;
  contact_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  work_log_id: string | null;
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export type ChecklistStatus = "준비" | "협의중" | "진행중" | "완료";

export const CHECKLIST_STATUS_OPTIONS: ChecklistStatus[] = [
  "준비",
  "협의중",
  "진행중",
  "완료",
];

export const CHECKLIST_STATUS_BADGE_CLASS: Record<ChecklistStatus, string> = {
  준비: "bg-gray-100 text-gray-600",
  협의중: "bg-amber-50 text-amber-700",
  진행중: "bg-blue-50 text-blue-700",
  완료: "bg-green-50 text-green-700",
};

export interface ChecklistItem {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  assignee: string | null;
  assignee_contact_id: string | null;
  status: ChecklistStatus;
  is_done: boolean;
  note: string | null;
  created_at: string;
}

export const PHASE_OPTIONS: ProjectPhase[] = [
  "design",
  "permit",
  "construction",
  "supervision",
  "completed",
];

export const PHASE_LABEL: Record<ProjectPhase, string> = {
  design: "설계",
  permit: "인허가",
  construction: "시공",
  supervision: "감리",
  completed: "준공",
};

export const PHASE_BADGE_CLASS: Record<ProjectPhase, string> = {
  design: "bg-blue-50 text-blue-700",
  permit: "bg-amber-50 text-amber-700",
  construction: "bg-brand-50 text-brand-700",
  supervision: "bg-purple-50 text-purple-700",
  completed: "bg-green-50 text-green-700",
};
