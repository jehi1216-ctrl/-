export interface ScheduleItem {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  content: string;
  is_done: boolean;
  created_at: string;
}
