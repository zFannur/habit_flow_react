import { useState, useMemo, useCallback } from 'react';
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
  parseLocalDate,
} from '@/entities/habit';
import type { HabitModel, HabitLogModel, HabitLogStatus } from '@/entities/habit';
import { BottomSheet } from '@/shared/ui';
import {
  ChevronLeft,
  Ellipsis,
  Flame,
  Trophy,
  Percent,
  ClipboardList,
  Edit2,
  Archive,
  Trash2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */

function computeStats(habit: HabitModel, logs: HabitLogModel[], today: string) {
  const currentStreakVal = currentStreak({ habit, logs, today });

  const start = parseLocalDate(habit.start_date);
  const end = new Date(today);
  const cursor = new Date(start);

  const byDate: Record<string, HabitLogModel> = {};
  for (const l of logs) byDate[l.log_date] = l;

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
        /* skip doesn't reset streak */
      } else {
        if (cursorStr !== today) runningStreak = 0;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Capture a best streak that runs up to (or through) today
  if (runningStreak > bestStreak) bestStreak = runningStreak;

  return {
    currentStreakVal,
    bestStreak,
    completionRate: activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0,
    totalCompleted: completedCount,
  };
}

function build90DayHeatmap(
  logs: HabitLogModel[],
  today: string,
): { date: string; status: HabitLogStatus | null }[][] {
  const todayDate = parseLocalDate(today);
  const cols = 10;

  const logsByDate: Record<string, HabitLogStatus> = {};
  for (const log of logs) logsByDate[log.log_date] = log.status;

  const grid: { date: string; status: HabitLogStatus | null }[][] = [];
  for (let c = 0; c < cols; c++) {
    const col: { date: string; status: HabitLogStatus | null }[] = [];
    for (let r = 0; r < 9; r++) {
      const dayOffset = r * cols + c;
      const d = new Date(todayDate);
      d.setDate(d.getDate() - (89 - dayOffset));
      const dStr = dateOnly(d);
      const isFuture = dStr > today;
      col.push({ date: dStr, status: isFuture ? null : (logsByDate[dStr] ?? null) });
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
  const todayDate = parseLocalDate(today);
  const weeks = 12;
  const result: number[] = [];

  const logsByDate: Record<string, HabitLogStatus> = {};
  for (const log of logs) logsByDate[log.log_date] = log.status;

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
        if (isHabitActiveOnDay(habit, cursor)) {
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

/* ------------------------------------------------------------------ */
/*  Simple SVG Line Chart                                              */
/* ------------------------------------------------------------------ */

function LineChart({ data }: { data: number[] }) {
  const { t } = useTranslation();
  const w = 320;
  const h = 150;
  const padLeft = 32;
  const padRight = 8;
  const padTop = 8;
  const padBottom = 20;
  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;

  if (data.length === 0) {
    return <div className="h-[150px] flex items-center justify-center text-hf-body-sm text-hf-text-tertiary">—</div>;
  }

  const maxVal = 100;
  const points = data
    .map((v, i) => {
      const x = padLeft + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = padTop + innerH - (v / maxVal) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPath = [
    `${padLeft},${padTop + innerH}`,
    ...data.map((v, i) => {
      const x = padLeft + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = padTop + innerH - (v / maxVal) * innerH;
      return `${x},${y}`;
    }),
    `${padLeft + innerW},${padTop + innerH}`,
  ].join(' ');

  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);

  return (
    <div className="relative" style={{ height: h }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--hf-success)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--hf-success)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* dashed horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padTop + innerH - (val / maxVal) * innerH;
          return (
            <g key={val}>
              <text x={padLeft - 4} y={y + 3} textAnchor="end" className="text-[8px] fill-hf-text-tertiary select-none font-medium">—</text>
              <line x1={padLeft} y1={y} x2={w - padRight} y2={y} stroke="var(--hf-border)" strokeDasharray="2 3" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* area fill */}
        <polygon points={areaPath} fill="url(#chartFill)" />

        {/* line */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--hf-success)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* x-axis labels every 4 weeks */}
        {data.map((_, i) => {
          if ((i + 1) % 4 !== 0 && i !== data.length - 1) return null;
          const x = padLeft + (i / Math.max(data.length - 1, 1)) * innerW;
          return (
            <text key={i} x={x} y={h - 2} textAnchor="middle" className="text-[8px] fill-hf-text-tertiary select-none font-medium">
              {t('habitDetailChartWeekShort', { n: i + 1 })}
            </text>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1 text-[10px] text-hf-text-tertiary px-2">
        <span>{t('habitDetailChartWeeks', { count: data.length })}</span>
        <span className="text-hf-success font-bold">{t('habitDetailChartAverage', { percent: avg })}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  iconColor?: string;
}

function StatCard({ icon, value, label, iconColor }: StatCardProps) {
  return (
    <div className="bg-hf-card border border-hf-border rounded-[16px] shadow-hf-card py-3.5 px-2 flex flex-col items-center gap-1">
      <div className={iconColor ?? 'text-hf-warning'}>{icon}</div>
      <span className="text-hf-display-md font-extrabold text-hf-text-primary leading-none">{value}</span>
      <span className="text-[10px] text-hf-text-secondary font-semibold uppercase tracking-wider text-center leading-tight">
        {label.split('\n').map((l, i) => (
          <span key={i}>{l}<br /></span>
        ))}
      </span>
    </div>
  );
}

interface BehaviorCardProps {
  emoji: string;
  label: string;
  value: string;
}

function BehaviorCard({ emoji, label, value }: BehaviorCardProps) {
  return (
    <div className="bg-hf-card border border-hf-border rounded-[14px] p-2.5 px-3 flex flex-col gap-1 min-h-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{emoji}</span>
        <span className="text-[10px] font-bold text-hf-text-secondary uppercase tracking-[0.04em]">{label}</span>
      </div>
      <p className="text-hf-label-md text-hf-text-primary leading-snug break-words">{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-hf-text-secondary uppercase tracking-[0.08em]">
      {children}
    </h3>
  );
}

interface HistoryItemProps {
  log: HabitLogModel;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

function HistoryItem({ log, t, locale }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasComment = !!log.comment;

  const d = parseLocalDate(log.log_date);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(d);

  const dotColor =
    log.status === 'done' || log.status === 'partial'
      ? 'bg-hf-success'
      : log.status === 'missed'
        ? 'bg-hf-danger'
        : 'bg-hf-text-tertiary';

  const dotGlow =
    log.status === 'done' || log.status === 'partial'
      ? '0 0 0 3px rgba(34,197,94,0.15)'
      : log.status === 'missed'
        ? '0 0 0 3px rgba(239,68,68,0.15)'
        : 'none';

  const statusLabels: Record<string, string> = {
    done: t('habitHistoryStatusDone'),
    partial: t('habitHistoryStatusDone'),
    missed: t('habitHistoryStatusMissed'),
    skipped: t('habitDetailHeatmapSkip'),
  };

  const statusEmojis: Record<string, string> = {
    done: '✅',
    partial: '✅',
    missed: '❌',
    skipped: '⏭',
  };

  return (
    <div
      className={`py-2.5 ${expanded ? '' : 'cursor-pointer'}`}
      onClick={() => hasComment && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
          style={{ boxShadow: dotGlow }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-hf-title-sm text-hf-text-primary font-medium">{dateLabel}</p>
          {!expanded && log.comment && (
            <p className="text-hf-body-sm text-hf-text-secondary italic truncate mt-0.5">
              {log.comment}
            </p>
          )}
        </div>
        <span className="text-hf-label-sm text-hf-text-secondary flex items-center gap-1 shrink-0">
          {statusEmojis[log.status] ?? ''} {statusLabels[log.status] ?? log.status}
        </span>
      </div>

      {expanded && log.comment && (
        <div className="mt-2 ml-5 pl-2 border-l-2 border-hf-border">
          <p className="text-[12px] text-hf-text-secondary italic leading-relaxed mb-1.5">
            {log.comment}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-hf-full bg-hf-accent/8 text-hf-accent cursor-pointer hover:bg-hf-accent/15 transition-all">
              {t('habitDetailHistoryEdit')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    return [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
  }, [logs]);

  const handleArchive = useCallback(async () => {
    if (!id) return;
    try {
      await archiveMutation.mutateAsync(id);
      setIsMenuOpen(false);
      navigate('/habits');
    } catch (e) {
      console.error(e);
    }
  }, [id, archiveMutation, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      setIsDeleteOpen(false);
      setIsMenuOpen(false);
      navigate('/habits');
    } catch (e) {
      console.error(e);
    }
  }, [id, deleteMutation, navigate]);

  /* ---------- loading skeleton ---------- */

  if (!habit || isLoadingLogs || !stats) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top pb-tg-safe-bottom">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="w-9 h-9 bg-hf-bg-secondary animate-pulse rounded-[10px]" />
          <div className="h-5 w-32 bg-hf-bg-secondary animate-pulse rounded" />
          <div className="w-9 h-9 bg-hf-bg-secondary animate-pulse rounded-[10px]" />
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="h-[120px] bg-hf-bg-secondary animate-pulse rounded-[16px]" />
          <div className="h-[100px] bg-hf-bg-secondary animate-pulse rounded-[16px]" />
          <div className="h-[150px] bg-hf-bg-secondary animate-pulse rounded-[16px]" />
        </div>
      </div>
    );
  }

  const isPaused = habit.end_date && habit.end_date < todayStr;

  /* ---------- heatmap cell color ---------- */

  const heatCellBg = (status: HabitLogStatus | null, isFuture: boolean) => {
    if (isFuture) return 'bg-transparent border border-hf-border opacity-20';
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
  };

  const weekdays = [t('habitWeekMon'), t('habitWeekTue'), t('habitWeekWed'), t('habitWeekThu'), t('habitWeekFri'), t('habitWeekSat'), t('habitWeekSun')];

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top pb-tg-safe-bottom overflow-y-auto">

      {/* ============================================================ */}
      {/*  CUSTOM HEADER                                               */}
      {/* ============================================================ */}

      <div className="sticky top-0 z-10 bg-hf-bg-primary border-b border-hf-border">
        <div className="flex items-center justify-between px-5 py-3.5">
          {/* back button circle */}
          <button
            type="button"
            onClick={() => navigate('/habits')}
            className="w-9 h-9 flex items-center justify-center bg-hf-card border-[1.5px] border-hf-border rounded-[10px] text-hf-text-secondary hover:opacity-90 active:scale-[0.95] transition-all shrink-0"
          >
            <ChevronLeft className="w-[18px] h-[18px]" />
          </button>

          {/* title */}
          <h2 className="text-hf-title-lg font-bold text-hf-text-primary tracking-[-0.02em] mx-2 truncate">
            {habit.name}
          </h2>

          {/* more menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-hf-card border-[1.5px] border-hf-border rounded-[10px] text-hf-text-secondary hover:opacity-90 active:scale-[0.95] transition-all shrink-0"
          >
            <Ellipsis className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  CONTENT                                                     */}
      {/* ============================================================ */}

      <div className="flex-1 flex flex-col gap-4 px-4 py-4 pb-8">

        {/* archives / paused badges */}
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

        {/* ========================================================== */}
        {/*  HERO                                                      */}
        {/* ========================================================== */}

        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-[60px] h-[60px] rounded-full bg-hf-bg-secondary flex items-center justify-center text-[30px] border border-hf-border">
            {habit.icon_emoji || '✅'}
          </div>
          <h1 className="text-hf-headline-md font-bold text-hf-text-primary text-center">{habit.name}</h1>
          {habit.category && (
            <span className="text-hf-body-sm text-hf-text-tertiary">{habit.category}</span>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame className="w-4 h-4 text-hf-warning" />
            <span className="text-hf-title-sm font-bold text-hf-warning">{stats.currentStreakVal}</span>
            <span className="text-hf-body-sm text-hf-text-secondary">{t('habitDetailDaysUnit')}</span>
          </div>
        </div>

        {/* ========================================================== */}
        {/*  STATISTICS                                                */}
        {/* ========================================================== */}

        <SectionLabel>{t('habitDetailStatistics')}</SectionLabel>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            iconColor="text-hf-warning"
            value={stats.currentStreakVal}
            label={t('habitDetailCurrentStreak')}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            iconColor="text-hf-success"
            value={stats.bestStreak}
            label={t('habitDetailBestStreak')}
          />
          <StatCard
            icon={<Percent className="w-5 h-5" />}
            iconColor="text-hf-accent"
            value={<>{stats.completionRate}%</>}
            label={t('habitDetailLast30Days')}
          />
          <StatCard
            icon={<ClipboardList className="w-5 h-5" />}
            iconColor="text-hf-text-secondary"
            value={stats.totalCompleted}
            label={t('habitDetailTotalLogs')}
          />
        </div>

        {/* ========================================================== */}
        {/*  HEATMAP (Last 90 days)                                    */}
        {/* ========================================================== */}

        <SectionLabel>{t('habitDetailLast90Days')}</SectionLabel>

        <div className="bg-hf-card border border-hf-border rounded-[16px] shadow-hf-card p-4">
          <div className="flex gap-0.5 overflow-x-auto pb-1">
            {/* weekday labels on the left */}
            <div className="flex flex-col gap-[3px] mr-1.5 shrink-0">
              {weekdays.map((d, i) => (
                <span
                  key={i}
                  className="text-[8.5px] font-semibold text-hf-text-tertiary leading-none h-[14px] flex items-center"
                >
                  {i % 2 === 0 ? d : ''}
                </span>
              ))}
            </div>

            {/* heatmap columns */}
            {heatmap.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell, ri) => {
                  const isFuture = cell.date > todayStr;
                  return (
                    <div
                      key={ri}
                      title={cell.date}
                      className={`w-[14px] h-[14px] rounded-[3px] transition-all ${
                        heatCellBg(cell.status, isFuture)
                      } ${cell.date === todayStr ? 'ring-1.5 ring-hf-accent/60' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* legend */}
          <div className="flex gap-3 justify-center text-[10px] text-hf-text-secondary font-medium pt-3 mt-2 border-t border-hf-border">
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

        {/* ========================================================== */}
        {/*  DYNAMICS (Line Chart)                                     */}
        {/* ========================================================== */}

        {chartData.length > 0 && (
          <>
            <SectionLabel>{t('habitDetailDynamics')}</SectionLabel>

            <div className="bg-hf-card border border-hf-border rounded-[16px] shadow-hf-card p-4">
              <LineChart data={chartData} />
            </div>
          </>
        )}

        {/* ========================================================== */}
        {/*  BEHAVIOR                                                  */}
        {/* ========================================================== */}

        {(habit.implementation_when || habit.stack_after_habit_id || habit.two_minute_version || habit.identity_statement) && (
          <>
            <SectionLabel>{t('habitDetailBehavior')}</SectionLabel>

            <div className="grid grid-cols-2 gap-2">
              {habit.implementation_when && (
                <BehaviorCard
                  emoji="📍"
                  label={t('habitMoreSheetIntention')}
                  value={habit.implementation_when}
                />
              )}
              {habit.stack_after_habit_id && (
                <BehaviorCard
                  emoji="⚓"
                  label={t('habitDetailBehaviorAfter')}
                  value={habit.stack_after_habit_id.slice(0, 8)}
                />
              )}
              {habit.two_minute_version && (
                <BehaviorCard
                  emoji="⚡"
                  label={t('habitDetailBehaviorMin')}
                  value={habit.two_minute_version}
                />
              )}
              {habit.identity_statement && (
                <BehaviorCard
                  emoji="🪪"
                  label={t('habitMoreSheetIdentity')}
                  value={`"${habit.identity_statement}"`}
                />
              )}
            </div>
          </>
        )}

        {/* ========================================================== */}
        {/*  HISTORY                                                   */}
        {/* ========================================================== */}

        <SectionLabel>{t('habitDetailHistory')}</SectionLabel>

        <div className="bg-hf-card border border-hf-border rounded-[16px] shadow-hf-card overflow-hidden">
          <div className="p-4 flex flex-col divide-y divide-hf-border">
            {recentLogs.length === 0 ? (
              <p className="text-hf-body-sm text-hf-text-tertiary text-center py-4">—</p>
            ) : (
              recentLogs.map((log) => (
                <HistoryItem
                  key={log.id}
                  log={log}
                  t={t}
                  locale={locale}
                />
              ))
            )}
          </div>
        </div>

        {/* spacer for bottom padding */}
        <div className="h-4" />
      </div>

      {/* ============================================================ */}
      {/*  BOTTOM SHEETS                                               */}
      {/* ============================================================ */}

      {/* More menu */}
      <BottomSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={t('habitDetailActions')}
      >
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              navigate(`/habits/${habit.id}/edit`);
            }}
            className="w-full py-3.5 text-left text-hf-body-md text-hf-text-primary hover:opacity-90 active:opacity-80 transition-all flex items-center gap-3"
          >
            <Edit2 className="w-4 h-4 text-hf-accent" />
            {t('commonEdit')}
          </button>

          <div className="h-px bg-hf-border" />

          {!habit.is_archived && (
            <>
              <button
                type="button"
                onClick={handleArchive}
                className="w-full py-3.5 text-left text-hf-body-md text-hf-text-primary hover:opacity-90 active:opacity-80 transition-all flex items-center gap-3"
              >
                <Archive className="w-4 h-4 text-hf-warning" />
                {t('habitDetailArchive')}
              </button>
              <div className="h-px bg-hf-border" />
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              setIsDeleteOpen(true);
            }}
            className="w-full py-3.5 text-left text-hf-body-md text-hf-danger hover:opacity-90 active:opacity-80 transition-all flex items-center gap-3"
          >
            <Trash2 className="w-4 h-4" />
            {t('commonDelete')}
          </button>
        </div>
      </BottomSheet>

      {/* Delete confirmation */}
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
