export interface ScheduleItem {
  id: string;
  user_id: string;
  project_id: string | null; // 선택 — 지정하면 캘린더에서 현장 색으로 표시된다
  date: string; // YYYY-MM-DD
  content: string;
  is_done: boolean;
  created_at: string;
}
