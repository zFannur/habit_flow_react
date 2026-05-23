import { describe, it, expect } from 'vitest';
import { isHabitActiveOnDay, currentStreak, sortByStack } from './helpers';
import type { HabitModel, HabitLogModel } from '../model/types';

const mockHabit = (overrides: Partial<HabitModel> = {}): HabitModel => ({
  id: 'h1',
  user_id: 'u1',
  name: 'Drink Water',
  habit_type: 'binary',
  schedule_type: 'daily',
  schedule_config: {},
  reminder_times: [],
  start_date: '2026-05-01',
  is_archived: false,
  position: 0,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('isHabitActiveOnDay', () => {
  it('should be active on start date and daily cadence', () => {
    const habit = mockHabit();
    expect(isHabitActiveOnDay(habit, new Date('2026-05-01'))).toBe(true);
    expect(isHabitActiveOnDay(habit, new Date('2026-05-02'))).toBe(true);
  });

  it('should not be active before start date', () => {
    const habit = mockHabit();
    expect(isHabitActiveOnDay(habit, new Date('2026-04-30'))).toBe(false);
  });

  it('should respect weekdays configuration', () => {
    // 2026-05-01 is Friday (isoDay = 5), 2026-05-02 is Saturday (isoDay = 6)
    const habit = mockHabit({
      schedule_type: 'weekdays',
      schedule_config: { weekdays: [1, 3, 5] }, // Mon, Wed, Fri
    });
    expect(isHabitActiveOnDay(habit, new Date('2026-05-01'))).toBe(true); // Fri
    expect(isHabitActiveOnDay(habit, new Date('2026-05-02'))).toBe(false); // Sat
  });

  it('should respect every_n_days configuration', () => {
    const habit = mockHabit({
      schedule_type: 'every_n_days',
      schedule_config: { every_n: 3 },
    });
    expect(isHabitActiveOnDay(habit, new Date('2026-05-01'))).toBe(true); // Day 0
    expect(isHabitActiveOnDay(habit, new Date('2026-05-02'))).toBe(false); // Day 1
    expect(isHabitActiveOnDay(habit, new Date('2026-05-04'))).toBe(true); // Day 3
  });
});

describe('currentStreak', () => {
  const logs: HabitLogModel[] = [
    { id: '1', user_id: 'u1', habit_id: 'h1', log_date: '2026-05-10', status: 'done', created_at: '' },
    { id: '2', user_id: 'u1', habit_id: 'h1', log_date: '2026-05-09', status: 'done', created_at: '' },
    { id: '3', user_id: 'u1', habit_id: 'h1', log_date: '2026-05-08', status: 'skipped', created_at: '' },
    { id: '4', user_id: 'u1', habit_id: 'h1', log_date: '2026-05-07', status: 'done', created_at: '' },
  ];

  it('should calculate streak including skipped days', () => {
    const habit = mockHabit({ start_date: '2026-05-01' });
    const streak = currentStreak({ habit, logs, today: '2026-05-10' });
    expect(streak).toBe(3); // 2026-05-10, 05-09, 05-07 are done (3), 05-08 is skipped (keeps streak alive)
  });

  it('should break streak on missed days', () => {
    const habit = mockHabit({ start_date: '2026-05-01' });
    const logsWithMissed: HabitLogModel[] = [
      ...logs,
      { id: '5', user_id: 'u1', habit_id: 'h1', log_date: '2026-05-06', status: 'missed', created_at: '' },
      { id: '6', user_id: 'u1', habit_id: 'h1', log_date: '2026-05-05', status: 'done', created_at: '' },
    ];
    const streak = currentStreak({ habit, logs: logsWithMissed, today: '2026-05-10' });
    expect(streak).toBe(3); // Stops at the missed day on 2026-05-06
  });
});

describe('sortByStack', () => {
  it('should sort habits according to dependency stack', () => {
    const h1 = mockHabit({ id: 'h1', name: 'Anchor A' });
    const h2 = mockHabit({ id: 'h2', name: 'Follower B', stack_after_habit_id: 'h1' });
    const h3 = mockHabit({ id: 'h3', name: 'Follower C', stack_after_habit_id: 'h2' });
    const h4 = mockHabit({ id: 'h4', name: 'Independent D' });

    // Shuffle input
    const sorted = sortByStack([h3, h4, h1, h2]);
    const ids = sorted.map(h => h.id);

    // h1 -> h2 -> h3 should be grouped together, h4 can be anywhere (before or after)
    const h1Idx = ids.indexOf('h1');
    const h2Idx = ids.indexOf('h2');
    const h3Idx = ids.indexOf('h3');

    expect(h2Idx).toBe(h1Idx + 1);
    expect(h3Idx).toBe(h2Idx + 1);
  });
});
