export type HabitType = 'binary' | 'countable' | 'timed' | 'anti';
export type ScheduleType = 'daily' | 'weekdays' | 'n_per_week' | 'every_n_days' | 'monthly_dates';
export type HabitStatus = 'active' | 'archived' | 'paused';
export type HabitLogStatus = 'done' | 'partial' | 'skipped' | 'missed';

export interface ScheduleConfig {
  weekdays?: number[];
  every_n?: number;
  n_per_week?: number;
  dates?: number[];
}

export interface HabitModel {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  category_id?: string;
  habit_type: HabitType;
  icon_emoji?: string;
  icon_telegram_file_id?: string;
  color?: string;

  // Target values
  target_value?: number;
  target_unit?: string;

  // Schedule
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
  reminder_times: string[]; // List of HH:MM strings
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD

  // Behaviour science (optional)
  stack_after_habit_id?: string;
  implementation_when?: string;
  implementation_where?: string;
  identity_statement?: string;
  two_minute_version?: string;
  reward?: string;

  // Position and archival
  is_archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface HabitLogModel {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string; // YYYY-MM-DD
  status: HabitLogStatus;
  value?: number;
  comment?: string;
  created_at: string;
}

export interface HabitCategoryModel {
  id: string;
  user_id?: string;
  name: string;
  icon_emoji?: string;
  created_at: string;
}
