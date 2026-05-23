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
import { ArrowLeft, Edit2, Archive, Trash2, Trophy, Flame, Percent, Calendar, Shield } from 'lucide-react';
import { BottomSheet } from '@/shared/ui';

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Queries
  const { data: habits } = useHabitsQuery(userId);
  const habit = habits?.find((h) => h.id === id);

  const { data: logs, isLoading: isLoadingLogs } = useHabitLogsQuery(userId, id);

  // Mutations
  const archiveMutation = useArchiveHabitMutation(userId || '');
  const deleteMutation = useDeleteHabitMutation(userId || '');

  const todayStr = dateOnly(new Date());

  const stats = useMemo(() => {
    if (!habit || !logs) return { currentStreakVal: 0, bestStreak: 0, completionRate: 0, last30Rate: 0, totalCompleted: 0 };

    const currentStreakVal = currentStreak({ habit, logs, today: todayStr });

    // Calculate details
    const start = new Date(habit.start_date);
    const end = new Date(todayStr);
    const cursor = new Date(start);

    const byDate = logs.reduce((acc, l) => {
      acc[l.log_date] = l;
      return acc;
    }, {} as Record<string, typeof logs[0]>);

    let activeCount = 0;
    let completedCount = 0;
    let runningStreak = 0;
    let bestStreak = 0;

    let last30Active = 0;
    let last30Completed = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = dateOnly(thirtyDaysAgo);

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
          if (runningStreak > bestStreak) {
            bestStreak = runningStreak;
          }
        } else if (log && log.status === 'skipped') {
          // Keep streak going but don't increment
        } else {
          if (cursorStr !== todayStr) {
            runningStreak = 0;
          }
        }

        if (cursorStr >= thirtyDaysAgoStr) {
          last30Active++;
          if (isDone) last30Completed++;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    const completionRate = activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0;
    const last30Rate = last30Active > 0 ? Math.round((last30Completed / last30Active) * 100) : 0;

    return {
      currentStreakVal,
      bestStreak: Math.max(bestStreak, currentStreakVal),
      completionRate,
      last30Rate,
      totalCompleted: completedCount,
    };
  }, [habit, logs, todayStr]);

  const handleArchive = async () => {
    if (!id) return;
    try {
      await archiveMutation.mutateAsync(id);
      alert(t('habitDetailArchivedToast'));
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

  // Build last 30 days calendar grid
  const last30DaysList = useMemo(() => {
    const list = [];
    const date = new Date();
    for (let i = 0; i < 30; i++) {
      list.push(new Date(date));
      date.setDate(date.getDate() - 1);
    }
    return list.reverse(); // Chronological
  }, []);

  const logsByDate = useMemo(() => {
    if (!logs) return {};
    return logs.reduce((acc, log) => {
      acc[log.log_date] = log.status;
      return acc;
    }, {} as Record<string, string>);
  }, [logs]);

  if (!habit || isLoadingLogs) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-hf-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-[120px] bg-hf-bg-secondary animate-pulse rounded-2xl mb-4" />
        <div className="h-40 bg-hf-bg-secondary animate-pulse rounded-2xl" />
      </div>
    );
  }

  const isPaused = habit.end_date && habit.end_date < todayStr;
  const isAnti = habit.habit_type === 'anti';

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-hf-border/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-hf-text-primary" />
        </button>
        <h2 className="text-[17px] font-bold truncate max-w-[60%] flex items-center gap-1.5">
          <span>{habit.icon_emoji || '✅'}</span>
          <span>{habit.name}</span>
        </h2>
        <button
          type="button"
          onClick={() => navigate(`/habits/${habit.id}/edit`)}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all text-hf-accent"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* Status badges if archived or paused */}
        {(habit.is_archived || isPaused) && (
          <div className="flex justify-center gap-2">
            {habit.is_archived && (
              <span className="text-[11px] font-extrabold tracking-wider bg-hf-warning/10 text-hf-warning px-2.5 py-1 rounded-full uppercase">
                {t('habitCardArchiveBadge')}
              </span>
            )}
            {isPaused && (
              <span className="text-[11px] font-extrabold tracking-wider bg-hf-text-secondary/15 text-hf-text-secondary px-2.5 py-1 rounded-full uppercase">
                PAUSED
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-sm">
            <Flame className={`w-5 h-5 mb-1.5 ${isAnti ? 'text-hf-anti' : 'text-hf-warning'}`} />
            <span className="text-[10px] text-hf-text-secondary font-semibold uppercase leading-none tracking-wider mb-1">
              {t('habitDetailCurrentStreak').replace('\n', ' ')}
            </span>
            <span className="text-xl font-extrabold">{stats.currentStreakVal}</span>
          </div>

          <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-sm">
            <Trophy className="w-5 h-5 text-yellow-500 mb-1.5" />
            <span className="text-[10px] text-hf-text-secondary font-semibold uppercase leading-none tracking-wider mb-1">
              {t('habitDetailBestStreak').replace('\n', ' ')}
            </span>
            <span className="text-xl font-extrabold">{stats.bestStreak}</span>
          </div>

          <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-sm">
            <Percent className="w-5 h-5 text-hf-accent mb-1.5" />
            <span className="text-[10px] text-hf-text-secondary font-semibold uppercase leading-none tracking-wider mb-1">
              {t('habitDetailLast30Days').replace('\n', ' ')}
            </span>
            <span className="text-xl font-extrabold">{stats.last30Rate}%</span>
          </div>
        </div>

        {/* Recent 30 Days Heatmap Grid */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-hf-accent" />
            {t('habitDetailStatistics')} (30 Days)
          </h3>
          <div className="grid grid-cols-10 gap-2.5 justify-items-center mt-1">
            {last30DaysList.map((day, idx) => {
              const dStr = dateOnly(day);
              const isToday = dStr === todayStr;
              const status = logsByDate[dStr];

              let cellBg = 'bg-hf-bg-secondary';
              if (status === 'done' || status === 'partial') cellBg = 'bg-hf-success';
              else if (status === 'missed') cellBg = 'bg-hf-danger';
              else if (status === 'skipped') cellBg = 'bg-hf-bg-secondary border border-hf-border/20';

              return (
                <div
                  key={idx}
                  title={dStr}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all relative ${cellBg} ${
                    isToday ? 'ring-2 ring-hf-accent' : ''
                  }`}
                >
                  <span className={status === 'done' || status === 'partial' || status === 'missed' ? 'text-white' : 'text-hf-text-primary'}>
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 justify-center text-[10px] text-hf-text-secondary font-medium border-t border-hf-border/10 pt-3 mt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-hf-success inline-block" />
              {t('habitDetailHeatmapDone')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-hf-danger inline-block" />
              {t('habitDetailHeatmapMissed')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-hf-bg-secondary border border-hf-border/20 inline-block" />
              {t('habitDetailHeatmapSkip')}
            </span>
          </div>
        </div>

        {/* Behavior Science Settings Card */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Shield className="w-4.5 h-4.5 text-hf-anti" />
            {t('habitDetailBehavior')}
          </h3>

          <div className="flex flex-col gap-2.5 text-[13px]">
            {habit.stack_after_habit_id && (
              <div className="flex justify-between border-b border-hf-border/5 pb-2">
                <span className="text-hf-text-secondary font-medium">{t('habitDetailBehaviorAfter')}</span>
                <span className="font-semibold text-hf-text-primary truncate max-w-[65%]">
                  ⚓ {habit.stack_after_habit_id}
                </span>
              </div>
            )}

            {(habit.implementation_when || habit.implementation_where) && (
              <div className="flex flex-col border-b border-hf-border/5 pb-2 gap-1">
                <span className="text-hf-text-secondary font-medium">{t('habitMoreSheetIntention')}</span>
                <span className="font-semibold text-hf-text-primary leading-snug">
                  When: {habit.implementation_when || '—'}<br />
                  Where: {habit.implementation_where || '—'}
                </span>
              </div>
            )}

            {habit.identity_statement && (
              <div className="flex justify-between border-b border-hf-border/5 pb-2">
                <span className="text-hf-text-secondary font-medium">{t('habitMoreSheetIdentity')}</span>
                <span className="font-semibold text-hf-text-primary truncate max-w-[65%] italic">
                  "{habit.identity_statement}"
                </span>
              </div>
            )}

            {habit.two_minute_version && (
              <div className="flex justify-between border-b border-hf-border/5 pb-2">
                <span className="text-hf-text-secondary font-medium">{t('habitDetailBehaviorMin')}</span>
                <span className="font-semibold text-hf-text-primary truncate max-w-[65%]">
                  ⚡ {habit.two_minute_version}
                </span>
              </div>
            )}

            {habit.reward && (
              <div className="flex justify-between pb-1">
                <span className="text-hf-text-secondary font-medium">{t('habitDetailBehaviorReward')}</span>
                <span className="font-semibold text-hf-text-primary truncate max-w-[65%]">
                  ☕ {habit.reward}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Button */}
        <div className="flex gap-3.5 mt-2 shrink-0 pb-6">
          {!habit.is_archived && (
            <button
              onClick={handleArchive}
              className="flex-1 py-3 px-4 rounded-xl border border-hf-warning/20 bg-hf-warning/5 text-hf-warning font-semibold text-[14px] flex items-center justify-center gap-1.5 hover:bg-hf-warning/10 active:scale-[0.98] transition-all"
            >
              <Archive className="w-4 h-4" />
              {t('habitDetailArchive')}
            </button>
          )}
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="flex-1 py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-semibold text-[14px] flex items-center justify-center gap-1.5 hover:bg-red-500/10 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {t('commonDelete')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={t('habitDetailDeleteConfirmTitle')}
      >
        <p className="text-[14px] text-hf-text-secondary mb-6 leading-relaxed">
          {t('habitDetailDeleteConfirmBody')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDeleteOpen(false)}
            className="flex-1 py-3 rounded-xl bg-hf-bg-secondary font-semibold text-[14px] text-hf-text-primary hover:opacity-95 active:scale-[0.98] transition-all"
          >
            {t('commonCancel')}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-[14px] hover:opacity-95 active:scale-[0.98] transition-all"
          >
            {t('commonDelete')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
