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
export const CONSULT_SUBOPTIONS = ["발주처", "구조", "토목", "MEP", "업체협의"] as const;
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
  decision: string | null; // 종료하며 남긴 결정사항, 선택
  created_at: string;
}

export const STATUS_OPTIONS: JournalStatus[] = ["todo", "waiting", "done"];

// 아직 끝나지 않은 일지(미처리). 대시보드와 전체 목록의 모아보기가 같은 기준을 쓴다.
export function isOpenLog(log: WorkLog): boolean {
  return log.status === "todo" || log.status === "waiting";
}

// 마감일이 있는 항목을 급한 순으로 앞에 세우고, 날짜가 없는 항목은 뒤로 보낸다.
export function compareOpenLogs(a: WorkLog, b: WorkLog): number {
  const ad = a.next_action_date;
  const bd = b.next_action_date;
  if (ad && bd) return ad < bd ? -1 : ad > bd ? 1 : 0;
  if (ad) return -1;
  if (bd) return 1;
  return 0;
}

export const STATUS_LABEL: Record<JournalStatus, string> = {
  todo: "내가 할 일",
  waiting: "답변 대기",
  done: "종료",
};

// 세 상태가 한눈에 갈리도록 배경을 진하게 하고 테두리(ring)를 둔다.
// 테두리는 카테고리 배지(테두리 없음)와 상태 배지를 구분하는 역할도 한다.
export const STATUS_BADGE_CLASS: Record<JournalStatus, string> = {
  todo: "bg-amber-100 text-amber-900 ring-1 ring-amber-300 hover:bg-amber-200",
  waiting: "bg-violet-100 text-violet-900 ring-1 ring-violet-300 hover:bg-violet-200",
  done: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-200",
};
