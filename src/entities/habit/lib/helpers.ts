import type { HabitModel, HabitLogModel, HabitStatus, HabitLogStatus } from '../model/types';

export const dateOnly = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear().toString().padStart(4, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Разбирает 'YYYY-MM-DD' как ЛОКАЛЬНУЮ полночь (new Date(str) дал бы UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export const getHabitStatus = (habit: HabitModel): HabitStatus => {
  if (habit.is_archived) return 'archived';
  if (habit.end_date) {
    const todayStr = dateOnly(new Date());
    if (habit.end_date < todayStr) return 'paused';
  }
  return 'active';
};

export const isHabitActiveOnDay = (habit: HabitModel, date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateStr = dateOnly(dateObj);

  if (dateStr < habit.start_date) return false;
  if (habit.end_date && dateStr > habit.end_date) return false;
  if (habit.is_archived) return false;

  const startDay = parseLocalDate(habit.start_date);
  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const start = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate());
  const diffDays = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const jsDay = d.getDay();
  const isoDay = jsDay === 0 ? 7 : jsDay;

  switch (habit.schedule_type) {
    case 'daily':
      return true;

    case 'weekdays': {
      const weekdays = habit.schedule_config.weekdays || [];
      return weekdays.includes(isoDay);
    }

    case 'every_n_days': {
      const n = Number(habit.schedule_config.every_n || 1);
      if (n <= 0) return false;
      return diffDays % n === 0;
    }

    case 'monthly_dates': {
      const dates = habit.schedule_config.dates || [];
      return dates.includes(d.getDate());
    }

    case 'n_per_week':
      return true;

    default:
      return false;
  }
};

export interface HabitWithLog {
  habit: HabitModel;
  log?: HabitLogModel;
}

export const currentStreak = ({
  habit,
  logs,
  today,
}: {
  habit: HabitModel;
  logs: HabitLogModel[];
  today: Date | string;
}): number => {
  const todayObj = typeof today === 'string' ? new Date(today) : today;
  if (logs.length === 0 && !isHabitActiveOnDay(habit, todayObj)) return 0;

  // Index logs by date YYYY-MM-DD
  const byDate: Record<string, HabitLogModel> = {};
  for (const log of logs) {
    byDate[log.log_date] = log;
  }

  const startStr = habit.start_date;
  const cursor = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
  let cursorStr = dateOnly(cursor);
  let streak = 0;

  const maxDays = 3650;
  let iterations = 0;

  while (cursorStr >= startStr && iterations < maxDays) {
    iterations++;
    if (!isHabitActiveOnDay(habit, cursor)) {
      cursor.setDate(cursor.getDate() - 1);
      cursorStr = dateOnly(cursor);
      continue;
    }

    const log = byDate[cursorStr];
    if (!log) {
      // If it is today and the user hasn't logged yet, continue to count past days
      if (cursorStr === dateOnly(todayObj)) {
        cursor.setDate(cursor.getDate() - 1);
        cursorStr = dateOnly(cursor);
        continue;
      }
      break;
    }

    if (log.status === 'done' || log.status === 'partial') {
      streak++;
    } else if (log.status === 'skipped') {
      // Keep streak but don't increment
    } else if (log.status === 'missed') {
      return streak;
    }

    cursor.setDate(cursor.getDate() - 1);
    cursorStr = dateOnly(cursor);
  }

  return streak;
};

export const buildHeatmap = ({
  logs,
  today,
  daysBack,
}: {
  logs: HabitLogModel[];
  today: Date | string;
  daysBack: number;
}): Record<string, HabitLogStatus> => {
  const todayObj = typeof today === 'string' ? new Date(today) : today;
  const todayStr = dateOnly(todayObj);

  const cutoff = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
  cutoff.setDate(cutoff.getDate() - (daysBack - 1));
  const cutoffStr = dateOnly(cutoff);

  const result: Record<string, HabitLogStatus> = {};
  for (const log of logs) {
    const d = log.log_date;
    if (d < cutoffStr || d > todayStr) continue;
    result[d] = log.status;
  }
  return result;
};

export const sortByStack = (habits: HabitModel[]): HabitModel[] => {
  if (habits.length < 2) return [...habits];

  const byId: Record<string, HabitModel> = {};
  for (const h of habits) {
    byId[h.id] = h;
  }

  const isFollower = (h: HabitModel): boolean => {
    const anchor = h.stack_after_habit_id;
    if (!anchor) return false;
    if (anchor === h.id) return false;
    return !!byId[anchor];
  };

  const followersByAnchor: Record<string, HabitModel[]> = {};
  for (const h of habits) {
    if (!isFollower(h)) continue;
    const anchor = h.stack_after_habit_id!;
    if (!followersByAnchor[anchor]) {
      followersByAnchor[anchor] = [];
    }
    followersByAnchor[anchor].push(h);
  }

  const result: HabitModel[] = [];
  const emitted = new Set<string>();

  const emit = (h: HabitModel) => {
    if (!emitted.has(h.id)) {
      emitted.add(h.id);
      result.push(h);
      const children = followersByAnchor[h.id];
      if (children) {
        for (const c of children) {
          emit(c);
        }
      }
    }
  };

  for (const h of habits) {
    if (isFollower(h)) continue;
    emit(h);
  }

  for (const h of habits) {
    if (emitted.has(h.id)) continue;
    emit(h);
  }

  return result;
};

export const combineHabitsWithLogs = ({
  habits,
  logsForDay,
  day,
}: {
  habits: HabitModel[];
  logsForDay: HabitLogModel[];
  day: Date | string;
}): HabitWithLog[] => {
  const dayStr = dateOnly(day);
  const logsByHabit: Record<string, HabitLogModel> = {};
  for (const log of logsForDay) {
    if (log.log_date === dayStr) {
      logsByHabit[log.habit_id] = log;
    }
  }

  return habits
    .filter(h => isHabitActiveOnDay(h, day))
    .map(h => ({
      habit: h,
      log: logsByHabit[h.id],
    }));
};
