export type JournalStatus = "todo" | "waiting" | "done";

export type LogType = "design" | "build";

export const LOG_TYPE_OPTIONS: LogType[] = ["design", "build"];

export const LOG_TYPE_LABEL: Record<LogType, string> = {
  design: "DESIGN",
  build: "BUILD",
};

export const CATEGORY_OPTIONS = [
  "검토",
  "협의",
  "설계",
  "PT",
  "대관",
  "브랜딩",
] as const;

export type CategoryName = (typeof CATEGORY_OPTIONS)[number];

export const BUILD_CATEGORY_OPTIONS = [
  "건축",
  "인테리어",
  "감리",
  "기타",
] as const;

export type BuildCategoryName = (typeof BUILD_CATEGORY_OPTIONS)[number];

export const REVIEW_SUBOPTIONS = ["규모검토", "디자인검토", "견적검토"] as const;
export const DESIGN_SUBOPTIONS = ["법적근거", "CAD", "3D"] as const;
export const PERMIT_DISCIPLINES = ["건축", "토목", "구조"] as const;
export const PERMIT_STAGES = ["심의", "허가", "사용승인"] as const;
export const CONSULT_SUBOPTIONS = ["구조", "토목", "MEP", "업체협의"] as const;
export const NUMBERED_CATEGORIES = ["협의", "PT", "브랜딩"] as const;

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
  브랜딩?: NumberedEntry;
}

export interface WorkLog {
  id: string;
  user_id: string;
  project_id: string;
  date: string; // YYYY-MM-DD
  log_type: LogType;
  content: string;
  result: string | null;
  categories: string[];
  category_details: CategoryDetails;
  status: JournalStatus;
  next_action: string | null;
  next_action_date: string | null; // YYYY-MM-DD, 선택
  created_at: string;
}

export const STATUS_OPTIONS: JournalStatus[] = ["todo", "waiting", "done"];

export const STATUS_LABEL: Record<JournalStatus, string> = {
  todo: "내가 할 일",
  waiting: "답변 대기",
  done: "종료",
};

export const STATUS_BADGE_CLASS: Record<JournalStatus, string> = {
  todo: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  waiting: "bg-violet-50 text-violet-700 hover:bg-violet-100",
  done: "bg-green-50 text-green-700 hover:bg-green-100",
};
