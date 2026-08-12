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

// 네 상태가 확실히 갈리도록 배경을 진하게 하고 테두리(ring)를 둔다. 특히 '진행중'은
// 지금 굴러가는 항목이라 가장 눈에 띄게 한 단계 더 진한 인디고를 쓴다.
// 이 클래스는 <select>에 그대로 붙으므로 글자색은 어둡게 유지할 것 —
// 흰 글자로 두면 브라우저에 따라 펼친 목록의 항목이 안 보인다.
export const CHECKLIST_STATUS_BADGE_CLASS: Record<ChecklistStatus, string> = {
  준비: "bg-gray-100 text-gray-600 ring-1 ring-gray-300",
  협의중: "bg-amber-100 text-amber-900 ring-1 ring-amber-300",
  진행중: "bg-indigo-200 text-indigo-900 ring-1 ring-indigo-500",
  완료: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300",
};

export interface ChecklistItem {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  group_id: string | null; // 담긴 폴더. null이면 '폴더 없음'
  assignee: string | null;
  assignee_contact_id: string | null;
  status: ChecklistStatus;
  is_done: boolean;
  note: string | null;
  created_at: string;
}

// 체크리스트 폴더. 현장 아래에서 항목을 묶는 상위 개념(예: "설계변경 보완사항").
export interface ChecklistGroup {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  created_at: string;
}

// 폴더에 담기지 않은 항목을 모아 보여줄 때 쓰는 이름.
export const NO_GROUP_LABEL = "폴더 없음";

// '폴더 없음' 묶음을 가리키는 /checklist?group= 값. 폴더 id(uuid)와 겹치지 않는다.
// 체크리스트 화면과 프로젝트 카드가 같은 링크를 만들어야 해서 여기에 둔다.
export const UNGROUPED_PARAM = "none";

// 체크리스트 담당자로 '나'를 고른 경우. 협력업체가 아니라 본인이므로
// assignee_contact_id는 비우고 레거시 자유 입력 칸(assignee)에 이 문구를 넣는다.
// 덕분에 표시/그룹핑 폴백이 그대로 동작하고 마이그레이션도 필요 없다.
// ME_OPTION_VALUE는 담당자 <select>에서만 쓰는 값으로, DB에는 저장되지 않는다.
export const ME_ASSIGNEE = "나";
export const ME_OPTION_VALUE = "me";

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
