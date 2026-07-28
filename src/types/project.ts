export type ProjectPhase = "design" | "permit" | "construction" | "completed";

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
  created_at: string;
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
  created_at: string;
}

export const PHASE_OPTIONS: ProjectPhase[] = [
  "design",
  "permit",
  "construction",
  "completed",
];

export const PHASE_LABEL: Record<ProjectPhase, string> = {
  design: "설계",
  permit: "인허가",
  construction: "시공",
  completed: "준공",
};

export const PHASE_BADGE_CLASS: Record<ProjectPhase, string> = {
  design: "bg-blue-50 text-blue-700",
  permit: "bg-amber-50 text-amber-700",
  construction: "bg-brand-50 text-brand-700",
  completed: "bg-green-50 text-green-700",
};
