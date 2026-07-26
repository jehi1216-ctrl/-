export type JournalStatus = "in_progress" | "done";

export const CATEGORY_OPTIONS = [
  "검토",
  "협의",
  "설계",
  "PT",
  "대관",
  "공사",
  "브랜딩",
] as const;

export type CategoryName = (typeof CATEGORY_OPTIONS)[number];

export const REVIEW_SUBOPTIONS = ["규모검토", "디자인검토", "견적검토"] as const;
export const DESIGN_SUBOPTIONS = ["법적근거", "CAD", "3D"] as const;
export const PERMIT_DISCIPLINES = ["건축", "토목", "구조"] as const;
export const PERMIT_STAGES = ["심의", "허가", "사용승인"] as const;
export const CONSULT_SUBOPTIONS = ["구조", "토목", "MEP", "업체협의"] as const;
export const NUMBERED_CATEGORIES = ["협의", "PT", "공사", "브랜딩"] as const;

export interface NumberedEntry {
  seq: number;
  title: string;
}

export interface CategoryDetails {
  검토?: string[];
  설계?: string[];
  대관?: string[];
  협의_sub?: string[];
  협의?: NumberedEntry;
  PT?: NumberedEntry;
  공사?: NumberedEntry;
  브랜딩?: NumberedEntry;
}

export interface WorkLog {
  id: string;
  user_id: string;
  project_id: string;
  date: string; // YYYY-MM-DD
  content: string;
  categories: string[];
  category_details: CategoryDetails;
  status: JournalStatus;
  created_at: string;
}

export const STATUS_LABEL: Record<JournalStatus, string> = {
  in_progress: "진행중",
  done: "완료",
};
