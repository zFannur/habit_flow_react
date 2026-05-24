import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useHabitsQuery,
  useHabitLogsQuery,
  useArchiveHabitMutation,
  useDeleteHabitMutation,
  currentStreak,
  isHabitActiveOnDay,
  dateOnly,
} from '@/entities/habit';
import type { HabitModel, HabitLogModel, HabitLogStatus } from '@/entities/habit';
import { HeaderBar, BottomSheet } from '@/shared/ui';
import { Edit2, Archive, Trash2, Flame, Percent, ClipboardList } from 'lucide-react';

function computeStats(
  habit: HabitModel,
  logs: HabitLogModel[],
  today: string,
) {
  const currentStreakVal = currentStreak({ habit, logs, today });

  const start = new Date(habit.start_date);
  const end = new Date(today);
  const cursor = new Date(start);

  const byDate: Record<string, HabitLogModel> = {};
  for (const l of logs) {
    byDate[l.log_date] = l;
  }

  let activeCount = 0;
  let completedCount = 0;
  let runningStreak = 0;
  let bestStreak = 0;

  while (cursor <= end) {
    const cursorStr = dateOnly(cursor);
    const active = isHabitActiveOnDay(habit, cursor);

    if (active) {
      activeCount++;
      const log = byDate[cursorStr];
      const isDone = log && (log.status === 'done' || log.status === 'partial');

      if (isDone) {
        completedCount++;
        runningStreak++;
        if (runningStreak > bestStreak) bestStreak = runningStreak;
      } else if (log && log.status === 'skipped') {
        // skipped days don't break or increment streak
      } else {
        if (cursorStr !== today) runningStreak = 0;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  const completionRate = activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0;

  return {
    currentStreakVal,
    bestStreak,
    completionRate,
    totalCompleted: completedCount,
  };
}

function build90DayHeatmap(
  logs: HabitLogModel[],
  today: string,
): { date: string; status: HabitLogStatus | null }[][] {
  const todayDate = new Date(today);
  const cols = 10;

  const logsByDate: Record<string, HabitLogStatus> = {};
  for (const log of logs) {
    logsByDate[log.log_date] = log.status;
  }

  const grid: { date: string; status: HabitLogStatus | null }[][] = [];
  for (let c = 0; c < cols; c++) {
    const col: { date: string; status: HabitLogStatus | null }[] = [];
    for (let r = 0; r < 9; r++) {
      const dayOffset = r * cols + c;
      const d = new Date(todayDate);
      d.setDate(d.getDate() - (89 - dayOffset));
      const dStr = dateOnly(d);
      const isFuture = dStr > today;
      col.push({
        date: dStr,
        status: isFuture ? null : (logsByDate[dStr] ?? null),
      });
    }
    grid.push(col);
  }

  return grid;
}

function build12WeekChart(
  logs: HabitLogModel[],
  habit: HabitModel,
  today: string,
): number[] {
  const todayDate = new Date(today);
  const weeks = 12;
  const result: number[] = [];

  const logsByDate: Record<string, HabitLogStatus> = {};
  for (const log of logs) {
    logsByDate[log.log_date] = log.status;
  }

  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(todayDate);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    let done = 0;
    let total = 0;
    const cursor = new Date(weekStart);

    for (let d = 0; d < 7; d++) {
      const dStr = dateOnly(cursor);
      if (dStr <= today) {
        const active = isHabitActiveOnDay(habit, cursor);
        if (active) {
          total++;
          const status = logsByDate[dStr];
          if (status === 'done' || status === 'partial') done++;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    result.push(total > 0 ? Math.round((done / total) * 100) : 0);
  }

  return result;
}

function statusColor(status: HabitLogStatus | null): string {
  switch (status) {
    case 'done':
    case 'partial':
      return 'bg-hf-success';
    case 'missed':
      return 'bg-hf-danger';
    case 'skipped':
      return 'bg-hf-bg-tertiary border border-hf-border';
    default:
      return 'bg-hf-bg-tertiary';
  }
}

function statusBadge(status: string): { bg: string; text: string; key: string } {
  switch (status) {
    case 'done':
    case 'partial':
      return { bg: 'bg-hf-success/10 text-hf-success', text: '✅', key: 'habitHistoryStatusDone' };
    case 'missed':
      return { bg: 'bg-hf-danger/10 text-hf-danger', text: '❌', key: 'habitHistoryStatusMissed' };
    case 'skipped':
      return { bg: 'bg-hf-text-secondary/10 text-hf-text-secondary', text: '⏭', key: 'habitDetailHeatmapSkip' };
    default:
      return { bg: '', text: '', key: '' };
  }
}

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: habits } = useHabitsQuery(userId);
  const habit = habits?.find((h) => h.id === id);

  const { data: logs, isLoading: isLoadingLogs } = useHabitLogsQuery(userId, id);

  const archiveMutation = useArchiveHabitMutation(userId || '');
  const deleteMutation = useDeleteHabitMutation(userId || '');

  const todayStr = dateOnly(new Date());

  const stats = useMemo(() => {
    if (!habit || !logs) return null;
    return computeStats(habit, logs, todayStr);
  }, [habit, logs, todayStr]);

  const heatmap = useMemo(() => {
    if (!logs) return [];
    return build90DayHeatmap(logs, todayStr);
  }, [logs, todayStr]);

  const chartData = useMemo(() => {
    if (!habit || !logs) return [];
    return build12WeekChart(logs, habit, todayStr);
  }, [habit, logs, todayStr]);

  const recentLogs = useMemo(() => {
    if (!logs) return [];
    return [...logs]
      .sort((a, b) => b.log_date.localeCompare(a.log_date))
      .slice(0, 10);
  }, [logs]);

  const handleArchive = async () => {
    if (!id) return;
    try {
      await archiveMutation.mutateAsync(id);
      navigate('/habits');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      setIsDeleteOpen(false);
      navigate('/habits');
    } catch (e) {
      console.error(e);
    }
  };

  if (!habit || isLoadingLogs || !stats) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-hf-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-[120px] bg-hf-bg-secondary animate-pulse rounded-hf-lg mb-4" />
        <div className="h-40 bg-hf-bg-secondary animate-pulse rounded-hf-lg" />
      </div>
    );
  }

  const isPaused = habit.end_date && habit.end_date < todayStr;

  const trailing = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => navigate(`/habits/${habit.id}/edit`)}
        className="p-2 rounded-hf-md bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all text-hf-accent"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setIsMoreOpen(true)}
        className="p-2 rounded-hf-md bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all text-hf-text-primary"
      >
        <Archive className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      <HeaderBar
        title={habit.name}
        onBack={() => navigate('/habits')}
        trailing={trailing}
      />

      <div className="flex-1 flex flex-col gap-5 max-w-md mx-auto w-full p-4 pb-8">
        {(habit.is_archived || isPaused) && (
          <div className="flex justify-center gap-2">
            {habit.is_archived && (
              <span className="text-[11px] font-extrabold tracking-wider bg-hf-warning/10 text-hf-warning px-2.5 py-1 rounded-hf-full uppercase">
                {t('habitCardArchiveBadge')}
              </span>
            )}
            {isPaused && (
              <span className="text-[11px] font-extrabold tracking-wider bg-hf-text-secondary/15 text-hf-text-secondary px-2.5 py-1 rounded-hf-full uppercase">
                {t('habitDetailPaused')}
              </span>
            )}
          </div>
        )}

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[28px]">{habit.icon_emoji || '✅'}</span>
            <div>
              <h3 className="text-hf-headline-md font-bold text-hf-text-primary">
                {habit.name}
              </h3>
              {habit.category && (
                <p className="text-hf-body-sm text-hf-text-tertiary">{habit.category}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-hf-bg-secondary rounded-hf-md p-3 text-center">
              <Flame className="w-5 h-5 text-hf-warning mx-auto mb-1" />
              <span className="text-[10px] text-hf-text-secondary font-semibold uppercase tracking-wider leading-none">
                {t('habitDetailCurrentStreak').replace('\n', ' ')}
              </span>
              <p className="text-hf-headline-md font-extrabold text-hf-text-primary mt-0.5">
                {stats.currentStreakVal}
                <span className="text-hf-body-sm font-normal text-hf-text-secondary ml-0.5">{t('habitDetailDaysUnit')}</span>
              </p>
            </div>

            <div className="bg-hf-bg-secondary rounded-hf-md p-3 text-center">
              <Percent className="w-5 h-5 text-hf-accent mx-auto mb-1" />
              <span className="text-[10px] text-hf-text-secondary font-semibold uppercase tracking-wider leading-none">
                {t('habitDetailLast30Days').replace('\n', ' ')}
              </span>
              <p className="text-hf-headline-md font-extrabold text-hf-text-primary mt-0.5">
                {stats.completionRate}%
              </p>
            </div>

            <div className="bg-hf-bg-secondary rounded-hf-md p-3 text-center">
              <ClipboardList className="w-5 h-5 text-hf-text-secondary mx-auto mb-1" />
              <span className="text-[10px] text-hf-text-secondary font-semibold uppercase tracking-wider leading-none">
                {t('habitDetailTotalLogs')}
              </span>
              <p className="text-hf-headline-md font-extrabold text-hf-text-primary mt-0.5">
                {stats.totalCompleted}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex flex-col gap-2">
          <h3 className="text-hf-body-md font-bold text-hf-text-primary">
            {t('habitDetailLast90Days')}
          </h3>

          <div className="flex justify-center gap-[3px]">
            {heatmap.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell, ri) => (
                  <div
                    key={ri}
                    title={cell.date}
                    className={`w-[10px] h-[10px] rounded-[2px] ${statusColor(cell.status)} ${
                      cell.date === todayStr ? 'ring-1 ring-hf-accent ring-offset-1' : ''
                    } ${!cell.status && cell.date > todayStr ? 'opacity-20' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center text-[10px] text-hf-text-secondary font-medium pt-2 border-t border-hf-border">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-[2px] bg-hf-success inline-block" />
              {t('habitDetailHeatmapDone')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-[2px] bg-hf-danger inline-block" />
              {t('habitDetailHeatmapMissed')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-[2px] bg-hf-bg-tertiary border border-hf-border inline-block" />
              {t('habitDetailHeatmapSkip')}
            </span>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4">
            <h3 className="text-hf-body-md font-bold text-hf-text-primary mb-3">
              {t('habitDetailDynamics')}
            </h3>

            <div className="flex items-end gap-[3px] h-[100px]">
              {chartData.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-[2px] bg-hf-success/60 min-h-[2px] transition-all"
                    style={{ height: `${Math.max(val, 2)}%` }}
                  />
                  {(i + 1) % 4 === 0 && (
                    <span className="text-[8px] text-hf-text-tertiary mt-1">
                      W{i + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-3 pt-2 border-t border-hf-border text-[10px] text-hf-text-tertiary">
              <span>{t('habitDetailChartWeeks', { count: chartData.length })}</span>
              <span className="text-hf-success font-bold">
              {t('habitDetailChartAverage', {
                    percent: chartData.length
                      ? Math.round(chartData.reduce((a, b) => a + b, 0) / chartData.length)
                      : 0,
                  })}
              </span>
            </div>
          </div>
        )}

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex flex-col gap-3">
          <h3 className="text-hf-body-md font-bold text-hf-text-primary">
            {t('habitDetailBehavior')}
          </h3>

          <div className="flex flex-col gap-2.5 text-hf-body-sm">
            {habit.implementation_when && (
              <div className="flex justify-between border-b border-hf-border/5 pb-2">
                <span className="text-hf-text-secondary font-medium">{t('habitMoreSheetIntention')}</span>
                <span className="font-semibold text-hf-text-primary truncate max-w-[60%] text-right">
                  When: {habit.implementation_when}
                </span>
              </div>
            )}

            {habit.stack_after_habit_id && (
              <div className="flex justify-between border-b border-hf-border/5 pb-2">
                <span className="text-hf-text-secondary font-medium">{t('habitDetailBehaviorAfter')}</span>
                <span className="font-semibold text-hf-text-primary truncate max-w-[60%] text-right">
                  After: ⚓ {habit.stack_after_habit_id.slice(0, 8)}
                </span>
              </div>
            )}

            {habit.two_minute_version && (
              <div className="flex justify-between border-b border-hf-border/5 pb-2">
                <span className="text-hf-text-secondary font-medium">{t('habitDetailBehaviorMin')}</span>
                <span className="font-semibold text-hf-text-primary truncate max-w-[60%] text-right">
                  ⚡ {habit.two_minute_version}
                </span>
              </div>
            )}

            {habit.identity_statement && (
              <div className="flex justify-between pb-1">
                <span className="text-hf-text-secondary font-medium">{t('habitMoreSheetIdentity')}</span>
                <span className="font-semibold text-hf-text-primary italic truncate max-w-[60%] text-right">
                  "{habit.identity_statement}"
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4">
          <h3 className="text-hf-body-md font-bold text-hf-text-primary mb-3">
            {t('habitDetailHistory')}
          </h3>

          {recentLogs.length === 0 ? (
            <p className="text-hf-body-sm text-hf-text-tertiary text-center py-4">—</p>
          ) : (
            <div className="flex flex-col">
              {recentLogs.map((log, i) => {
                const badge = statusBadge(log.status);
                const d = new Date(log.log_date);
                const dateLabel = new Intl.DateTimeFormat(locale, {
                  day: 'numeric',
                  month: 'short',
                  weekday: 'short',
                }).format(d);

                return (
                  <div
                    key={log.id}
                    className={`flex items-center gap-3 py-2.5 ${
                      i < recentLogs.length - 1 ? 'border-b border-hf-border' : ''
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        log.status === 'done' || log.status === 'partial'
                          ? 'bg-hf-success'
                          : log.status === 'missed'
                            ? 'bg-hf-danger'
                            : 'bg-hf-text-tertiary'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-hf-body-sm text-hf-text-primary font-medium">
                        {dateLabel}
                      </p>
                      {log.comment && (
                        <p className="text-hf-label-sm text-hf-text-secondary italic truncate mt-0.5">
                          {log.comment}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-hf-label-sm font-semibold px-2 py-0.5 rounded-hf-full ${badge.bg}`}
                    >
                      {badge.text} {badge.key ? t(badge.key as Parameters<typeof t>[0]) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-1">
          {!habit.is_archived && (
            <button
              onClick={handleArchive}
              className="w-full py-3 px-4 rounded-hf-md border border-hf-warning/20 bg-hf-warning/5 text-hf-warning font-semibold text-hf-body-md flex items-center justify-center gap-1.5 hover:bg-hf-warning/10 active:scale-[0.98] transition-all"
            >
              <Archive className="w-4 h-4" />
              {t('habitDetailArchive')}
            </button>
          )}
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="w-full py-3 px-4 rounded-hf-md border border-hf-danger/20 bg-hf-danger/5 text-hf-danger font-semibold text-hf-body-md flex items-center justify-center gap-1.5 hover:bg-hf-danger/10 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {t('commonDelete')}
          </button>
        </div>

        <button
          onClick={() => navigate('/habits')}
          className="w-full py-3 rounded-hf-md border border-hf-border bg-hf-bg-secondary text-hf-text-primary font-semibold text-hf-body-md flex items-center justify-center gap-2 hover:bg-hf-bg-secondary/50 active:scale-[0.98] transition-all mt-2"
        >
          {t('commonBack')}
        </button>
      </div>

      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title={t('habitDetailActions')}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={handleArchive}
            className="w-full py-3 rounded-hf-md border border-hf-warning/20 bg-hf-warning/5 text-hf-warning font-semibold text-hf-body-md flex items-center justify-center gap-2 hover:bg-hf-warning/10 active:scale-[0.98] transition-all"
          >
            <Archive className="w-4 h-4" />
            {t('habitDetailArchive')}
          </button>
          <button
            onClick={() => {
              setIsMoreOpen(false);
              setIsDeleteOpen(true);
            }}
            className="w-full py-3 rounded-hf-md border border-hf-danger/20 bg-hf-danger/5 text-hf-danger font-semibold text-hf-body-md flex items-center justify-center gap-2 hover:bg-hf-danger/10 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {t('commonDelete')}
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={t('habitDetailDeleteConfirmTitle')}
      >
        <p className="text-hf-body-md text-hf-text-secondary mb-6 leading-relaxed">
          {t('habitDetailDeleteConfirmBody')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="flex-1 py-3 rounded-hf-md bg-hf-bg-secondary font-semibold text-hf-body-md text-hf-text-primary hover:opacity-95 active:scale-[0.98] transition-all"
          >
            {t('commonCancel')}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-3 rounded-hf-md bg-hf-danger text-white font-semibold text-hf-body-md hover:opacity-95 active:scale-[0.98] transition-all"
          >
            {t('commonDelete')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
