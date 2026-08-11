export interface ScheduleItem {
  id: string;
  user_id: string;
  project_id: string | null; // 선택 — 지정하면 캘린더에서 현장 색으로 표시된다
  date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM. 선택 — 없으면 시간 없는 일정
  content: string;
  is_done: boolean;
  created_at: string;
}
