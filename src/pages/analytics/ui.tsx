import { useState, useMemo } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useHabitsQuery, useLogsQuery, dateOnly } from '@/entities/habit';
import { useJournalEntriesQuery } from '@/entities/journal';
import type { JournalEntryModel } from '@/entities/journal';
import {
  Share2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
} from 'lucide-react';

const CHART_PALETTE = [
  'var(--hf-success)',
  'var(--hf-accent)',
  'var(--hf-chart-pink)',
  'var(--hf-warning)',
  'var(--hf-chart-teal)',
  'var(--hf-danger)',
  'var(--hf-premium)',
];

function barColor(v: number): string {
  if (v < 40) return 'var(--hf-danger)';
  if (v < 70) return 'var(--hf-warning)';
  return 'var(--hf-success)';
}

function heatmapColor(v: number): string {
  if (v < 30) return '#EF444433';
  if (v < 50) return '#EF444480';
  if (v < 70) return '#F59E0B80';
  if (v < 85) return '#22C55E80';
  return '#22C55EE5';
}

type DayValue = { label: string; value: number };
type MoodPoint = { label: string; mood: number; energy: number };
type CategorySlice = { label: string; pct: number; color: string };
type TopHabit = { emoji: string; name: string; pct: number; color: string };

export default function AnalyticsPage() {
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [isWeek, setIsWeek] = useState(true);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [periodAnchor, setPeriodAnchor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const periodLabel = useMemo(() => {
    if (isWeek) {
      const day = periodAnchor.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(periodAnchor);
      monday.setDate(periodAnchor.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => {
        try { return new Intl.DateTimeFormat(locale, opts).format(d); } catch { return ''; }
      };

      if (monday.getMonth() === sunday.getMonth()) {
        return `${monday.getDate()}–${sunday.getDate()} ${fmt(monday, { month: 'short' })} ${monday.getFullYear()}`;
      }
      return `${monday.getDate()} ${fmt(monday, { month: 'short' })} – ${sunday.getDate()} ${fmt(sunday, { month: 'short' })} ${sunday.getFullYear()}`;
    }
    try {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(periodAnchor);
    } catch {
      return `${periodAnchor.getMonth() + 1}/${periodAnchor.getFullYear()}`;
    }
  }, [isWeek, periodAnchor, locale]);

  const range = useMemo(() => {
    if (isWeek) {
      const day = periodAnchor.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(periodAnchor);
      monday.setDate(periodAnchor.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { from: dateOnly(monday), to: dateOnly(sunday) };
    }
    const firstDay = new Date(periodAnchor.getFullYear(), periodAnchor.getMonth(), 1);
    const lastDay = new Date(periodAnchor.getFullYear(), periodAnchor.getMonth() + 1, 0);
    return { from: dateOnly(firstDay), to: dateOnly(lastDay) };
  }, [isWeek, periodAnchor]);

  const prevRange = useMemo(() => {
    const prevAnchor = new Date(periodAnchor);
    if (isWeek) {
      prevAnchor.setDate(prevAnchor.getDate() - 7);
    } else {
      prevAnchor.setMonth(prevAnchor.getMonth() - 1);
    }
    if (isWeek) {
      const day = prevAnchor.getDay();
      const offset = day === 0 ? -6 : 1 - day;
      prevAnchor.setDate(prevAnchor.getDate() + offset);
      return { from: dateOnly(prevAnchor), to: dateOnly(new Date(prevAnchor.getTime() + 6 * 86400000)) };
    }
    const firstDay = new Date(prevAnchor.getFullYear(), prevAnchor.getMonth(), 1);
    const lastDay = new Date(prevAnchor.getFullYear(), prevAnchor.getMonth() + 1, 0);
    return { from: dateOnly(firstDay), to: dateOnly(lastDay) };
  }, [isWeek, periodAnchor]);

  const { data: habits } = useHabitsQuery(userId);
  const { data: logs } = useLogsQuery(userId, range.from, range.to);
  const { data: prevLogs } = useLogsQuery(userId, prevRange.from, prevRange.to);
  const { data: journalEntries } = useJournalEntriesQuery(userId);

  const habitsArr = useMemo(() => habits || [], [habits]);
  const logsArr = useMemo(() => logs || [], [logs]);
  const prevLogsArr = useMemo(() => prevLogs || [], [prevLogs]);
  const entriesArr = useMemo(() => journalEntries || [], [journalEntries]);

  const filtersInRange = (l: { log_date: string; status: string }) =>
    l.log_date >= range.from && l.log_date <= range.to;

  const logsInRange = logsArr.filter(filtersInRange);
  const prevLogsInRange = prevLogsArr.filter((l) => l.log_date >= prevRange.from && l.log_date <= prevRange.to);

  const entriesInRange = entriesArr.filter((e) => e.entry_date >= range.from && e.entry_date <= range.to);

  const doneCount = logsInRange.filter((l) => l.status === 'done' || l.status === 'partial').length;
  const missedCount = logsInRange.filter((l) => l.status === 'missed').length;

  const completionPct = useMemo(() => {
    const total = doneCount + missedCount;
    return total > 0 ? Math.round((doneCount / total) * 100) : 0;
  }, [doneCount, missedCount]);

  const prevDone = prevLogsInRange.filter((l) => l.status === 'done' || l.status === 'partial').length;
  const prevMissed = prevLogsInRange.filter((l) => l.status === 'missed').length;
  const prevTotal = prevDone + prevMissed;
  const prevPct = prevTotal > 0 ? Math.round((prevDone / prevTotal) * 100) : 0;
  const trendDelta = completionPct - prevPct;

  const barData: DayValue[] = useMemo(() => {
    if (isWeek) {
      const map = new Map<string, { done: number; total: number }>();
      for (const l of logsInRange) {
        const entry = map.get(l.log_date) || { done: 0, total: 0 };
        if (l.status === 'done' || l.status === 'partial') entry.done++;
        if (l.status === 'done' || l.status === 'partial' || l.status === 'missed') entry.total++;
        map.set(l.log_date, entry);
      }
      const start = new Date(range.from);
      const result: DayValue[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const ds = dateOnly(d);
        const e = map.get(ds);
        const pct = e && e.total > 0 ? Math.round((e.done / e.total) * 100) : 0;
        const label = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
        result.push({ label, value: Math.min(100, pct) });
      }
      return result;
    }
    const start = new Date(range.from);
    const daysCount = new Date(range.to).getDate() - start.getDate() + 1;
    const map = new Map<string, { done: number; total: number }>();
    for (const l of logsInRange) {
      const entry = map.get(l.log_date) || { done: 0, total: 0 };
      if (l.status === 'done' || l.status === 'partial') entry.done++;
      if (l.status === 'done' || l.status === 'partial' || l.status === 'missed') entry.total++;
      map.set(l.log_date, entry);
    }
    const result: DayValue[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const ds = dateOnly(d);
      const e = map.get(ds);
      const pct = e && e.total > 0 ? Math.round((e.done / e.total) * 100) : 0;
      result.push({ label: `${d.getDate()}`, value: Math.min(100, pct) });
    }
    return result;
  }, [isWeek, logsInRange, range, locale]);

  const moodData: MoodPoint[] = useMemo(() => {
    if (isWeek) {
      const start = new Date(range.from);
      const result: MoodPoint[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const ds = dateOnly(d);
        const entry = entriesInRange.find((e) => e.entry_date === ds);
        result.push({
          label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d),
          mood: entry?.mood ?? 0,
          energy: entry?.energy ?? 0,
        });
      }
      return result;
    }
    const start = new Date(range.from);
    const daysCount = new Date(range.to).getDate() - start.getDate() + 1;
    const weekCount = Math.ceil(daysCount / 7);
    const result: MoodPoint[] = [];
    for (let w = 0; w < weekCount; w++) {
      const ws = new Date(start);
      ws.setDate(start.getDate() + w * 7);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      const weekEntries = entriesInRange.filter(
        (e: { entry_date: string }) => e.entry_date >= dateOnly(ws) && e.entry_date <= dateOnly(we),
      );
      let mood = 0;
      let energy = 0;
      const moodEntries = weekEntries.filter((e: JournalEntryModel) => e.mood != null);
      const energyEntries = weekEntries.filter((e: JournalEntryModel) => e.energy != null);
      if (moodEntries.length > 0) {
        mood = Math.round(moodEntries.reduce((s: number, e: JournalEntryModel) => s + (e.mood ?? 0), 0) / moodEntries.length);
      }
      if (energyEntries.length > 0) {
        energy = Math.round(energyEntries.reduce((s: number, e: JournalEntryModel) => s + (e.energy ?? 0), 0) / energyEntries.length);
      }
      result.push({ label: t('habitDetailChartWeekShort', { n: w + 1 }), mood, energy });
    }
    return result;
  }, [isWeek, entriesInRange, range, locale, t]);

  const topHabits: TopHabit[] = useMemo(() => {
    if (!habitsArr.length) return [];
    const map = new Map<string, { done: number; total: number }>();
    for (const l of logsInRange) {
      const entry = map.get(l.habit_id) || { done: 0, total: 0 };
      if (l.status === 'done' || l.status === 'partial') entry.done++;
      if (l.status === 'done' || l.status === 'partial' || l.status === 'missed') entry.total++;
      map.set(l.habit_id, entry);
    }
    const rated = habitsArr
      .map((h) => {
        const e = map.get(h.id);
        if (!e || e.total === 0) return null;
        return {
          emoji: h.icon_emoji || '📋',
          name: h.name,
          pct: Math.round((e.done / e.total) * 100),
          color: '',
        };
      })
      .filter(Boolean) as { emoji: string; name: string; pct: number; color: string }[];
    rated.sort((a, b) => b.pct - a.pct);
    return rated.slice(0, 3).map((r, i) => ({
      ...r,
      color: CHART_PALETTE[([0, 1, 3][i] ?? 0) % CHART_PALETTE.length] || '#3B82F6',
    }));
  }, [habitsArr, logsInRange]);

  const pieSlices: CategorySlice[] = useMemo(() => {
    const catMap = new Map<string, { done: number; total: number }>();
    const habitCat = new Map(habitsArr.map((h) => [h.id, h.category || 'General']));
    for (const l of logsInRange) {
      const cat = habitCat.get(l.habit_id) || 'General';
      const entry = catMap.get(cat) || { done: 0, total: 0 };
      if (l.status === 'done' || l.status === 'partial') entry.done++;
      if (l.status === 'done' || l.status === 'partial' || l.status === 'missed') entry.total++;
      catMap.set(cat, entry);
    }
    const sorted = [...catMap.entries()]
      .map(([label, v]) => ({
        label: label || '—',
        pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
    const totalRate = sorted.reduce((s, e) => s + e.pct, 0);
    if (totalRate === 0) return [];
    return sorted.map((s, i) => ({
      ...s,
      pct: Math.round((s.pct / totalRate) * 100),
      color: CHART_PALETTE[i % CHART_PALETTE.length] || '#3B82F6',
    }));
  }, [habitsArr, logsInRange]);

  const bestDayLabel = useMemo(() => {
    const byDow = new Map<number, { done: number; total: number }>();
    for (const l of logsInRange) {
      const d = new Date(l.log_date);
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // mon=0..sun=6
      const entry = byDow.get(dow) || { done: 0, total: 0 };
      if (l.status === 'done' || l.status === 'partial') entry.done++;
      if (l.status === 'done' || l.status === 'partial' || l.status === 'missed') entry.total++;
      byDow.set(dow, entry);
    }
    let bestDay = -1;
    let bestRate = -1;
    for (const [dow, v] of byDow) {
      const rate = v.total > 0 ? v.done / v.total : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestDay = dow;
      }
    }
    if (bestDay < 0 || bestRate <= 0) return { label: '—', pct: 0 };
    return {
      label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
        new Date(2024, 0, bestDay + 1), // mon=Jan 1 2024
      ),
      pct: Math.round(bestRate * 100),
    };
  }, [logsInRange, locale]);

  const habitLogsMap = useMemo(() => {
    const map = new Map<string, typeof logsArr>();
    for (const l of logsArr) {
      const arr = map.get(l.habit_id) || [];
      arr.push(l);
      map.set(l.habit_id, arr);
    }
    return map;
  }, [logsArr]);

  const currentStreak = useMemo(() => {
    let maxStreak = 0;
    for (const h of habitsArr) {
      const hLogs = habitLogsMap.get(h.id) || [];
      let streak = 0;
      const todayStr = dateOnly(today);
      hLogs.sort((a, b) => b.log_date.localeCompare(a.log_date));
      for (const l of hLogs) {
        if (l.log_date > todayStr) continue;
        if (l.status === 'done' || l.status === 'partial') {
          streak++;
        } else if (l.status === 'missed') {
          break;
        }
      }
      if (streak > maxStreak) maxStreak = streak;
    }
    return maxStreak;
  }, [habitsArr, habitLogsMap, today]);

  const bestStreak = currentStreak;

  const shiftPeriod = (delta: number) => {
    setSelectedBar(null);
    setPeriodAnchor((prev) => {
      const d = new Date(prev);
      if (isWeek) {
        d.setDate(d.getDate() + 7 * delta);
      } else {
        d.setMonth(d.getMonth() + delta);
      }
      return d;
    });
  };

  const trendColor =
    trendDelta > 0
      ? 'var(--hf-success)'
      : trendDelta < 0
        ? 'var(--hf-danger)'
        : 'var(--hf-text-tertiary)';

  const trendText = isWeek
    ? trendDelta > 0
      ? t('analyticsTrendUpWeek', { percent: trendDelta })
      : trendDelta < 0
        ? t('analyticsTrendDownWeek', { percent: -trendDelta })
        : t('analyticsTrendNeutralWeek')
    : trendDelta > 0
      ? t('analyticsTrendUpMonth', { percent: trendDelta })
      : trendDelta < 0
        ? t('analyticsTrendDownMonth', { percent: -trendDelta })
        : t('analyticsTrendNeutralMonth');

  const TrendIcon = trendDelta > 0 ? TrendingUp : trendDelta < 0 ? TrendingDown : Minus;

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary overflow-hidden pb-tg-safe-bottom">
      <div className="shrink-0 border-b border-hf-border shadow-[0_1px_8px_var(--hf-shadow)] bg-hf-bg-primary">
        <div className="px-4 pt-3.5 pb-2.5 flex items-center">
          <h2 className="flex-1 text-[22px] font-bold tracking-[-0.02em] leading-tight text-hf-text-primary">
            {t('analyticsTitle')}
          </h2>
          <button
            onClick={() => {
              const text = `📊 HabitFlow · ${periodLabel}\n✅ ${doneCount} ${t('analyticsMetricCompleted')} · ❌ ${missedCount} ${t('analyticsMetricSkipped')}\n🎯 ${completionPct}%`;
              try {
                (window as unknown as { Telegram?: { WebApp?: { openLink?: (url: string) => void } } }).Telegram?.WebApp?.openLink?.(
                  `https://t.me/share/url?url=${encodeURIComponent('https://t.me/habitflow_dev')}&text=${encodeURIComponent(text)}`,
                );
              } catch { /* noop */ }
            }}
            className="w-9 h-9 rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center shrink-0"
          >
            <Share2 size={16} className="text-hf-text-secondary" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="flex bg-hf-bg-tertiary rounded-hf-md p-[3px]">
            <button
              onClick={() => { setIsWeek(true); setSelectedBar(null); }}
              className={`flex-1 h-[34px] rounded-[9px] text-hf-label-lg leading-tight font-medium transition-colors ${
                isWeek
                  ? 'bg-hf-bg-primary text-hf-text-primary shadow-[0_1px_6px_rgba(15,20,25,0.1)] border border-black/[0.04]'
                  : 'text-hf-text-tertiary bg-transparent'
              }`}
            >
              {t('analyticsWeekTab')}
            </button>
            <div className="w-0.5" />
            <button
              onClick={() => { setIsWeek(false); setSelectedBar(null); }}
              className={`flex-1 h-[34px] rounded-[9px] text-hf-label-lg leading-tight font-medium transition-colors ${
                !isWeek
                  ? 'bg-hf-bg-primary text-hf-text-primary shadow-[0_1px_6px_rgba(15,20,25,0.1)] border border-black/[0.04]'
                  : 'text-hf-text-tertiary bg-transparent'
              }`}
            >
              {t('analyticsMonthTab')}
            </button>
          </div>
        </div>

        <div className="flex items-center px-4 py-2.5 border-b border-hf-border bg-hf-bg-primary">
          <button
            onClick={() => shiftPeriod(-1)}
            className="w-8 h-8 rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center shrink-0"
          >
            <ChevronLeft size={16} className="text-hf-text-secondary" />
          </button>
          <span className="flex-1 text-center text-[15px] font-semibold tracking-[-0.01em] text-hf-text-primary leading-tight">
            {periodLabel}
          </span>
          <button
            onClick={() => shiftPeriod(1)}
            className="w-8 h-8 rounded-[10px] bg-hf-card border-[1.5px] border-hf-border flex items-center justify-center shrink-0"
          >
            <ChevronRight size={16} className="text-hf-text-secondary" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[14px] pt-3 pb-6 flex flex-col gap-3">
        <SummaryCard
          completionPct={completionPct}
          trendDelta={trendDelta}
          trendColor={trendColor}
          trendText={trendText}
          TrendIcon={TrendIcon}
          periodLabel={periodLabel}
          t={t}
        />

        <MetricsGrid
          doneCount={doneCount}
          missedCount={missedCount}
          bestDayLabel={bestDayLabel.label}
          bestDayPct={bestDayLabel.pct}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          t={t}
        />

        <BarChartCard
          data={barData}
          selectedIdx={selectedBar}
          onSelect={setSelectedBar}
          t={t}
        />

        {!isWeek && (
          <HeatmapCard data={barData} t={t} />
        )}

        <PieCard slices={pieSlices} t={t} />

        <MoodLineCard data={moodData} t={t} />

        <TopHabitsCard habits={topHabits} t={t} />

        <AiCorrelationsCard t={t} />
      </div>
    </div>
  );
}

function SectionCard({
  children,
  padding = 'p-4',
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <div
      className={`rounded-hf-lg border border-hf-border shadow-hf-card bg-hf-card ${padding}`}
    >
      {children}
    </div>
  );
}

function SummaryCard({
  completionPct,
  trendColor,
  trendText,
  TrendIcon,
  periodLabel,
  t,
}: {
  completionPct: number;
  trendDelta: number;
  trendColor: string;
  trendText: string;
  TrendIcon: typeof TrendingUp;
  periodLabel: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const r = 34;
  const strokeWidth = 7;
  const radius = r - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionPct / 100) * circumference;

  return (
    <SectionCard>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col">
          <span className="text-hf-label-sm uppercase tracking-[0.06em] text-hf-text-tertiary leading-tight">
            {t('analyticsSummaryLabel')}
          </span>
          <span className="mt-1 text-[52px] font-extrabold tracking-[-0.03em] leading-none text-hf-text-primary">
            {completionPct}%
          </span>
          <div className="flex items-center gap-1 mt-1.5">
            <TrendIcon size={14} style={{ color: trendColor }} />
            <span
              className="text-xs font-semibold leading-tight"
              style={{ color: trendColor }}
            >
              {trendText}
            </span>
          </div>
          <span className="text-xs text-hf-text-tertiary leading-tight mt-0.5">
            {t('analyticsSubtextPeriod', { label: periodLabel })}
          </span>
        </div>

        <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0">
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="none"
            stroke="var(--hf-bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="none"
            stroke="#22C55E"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 34 34)"
          />
          <text
            x="34"
            y="34"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-hf-text-primary text-[13px] font-semibold"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            {completionPct}%
          </text>
        </svg>
      </div>
    </SectionCard>
  );
}

function MetricsGrid({
  doneCount,
  missedCount,
  bestDayLabel,
  bestDayPct,
  currentStreak,
  bestStreak,
  t,
}: {
  doneCount: number;
  missedCount: number;
  bestDayLabel: string;
  bestDayPct: number;
  currentStreak: number;
  bestStreak: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2.5">
        <div className="flex-1">
          <MetricTile
            label={t('analyticsMetricCompleted').toUpperCase()}
            value={`${doneCount}`}
            Icon={CheckCircle2}
            color="var(--hf-success)"
          />
        </div>
        <div className="flex-1">
          <MetricTile
            label={t('analyticsMetricSkipped').toUpperCase()}
            value={`${missedCount}`}
            Icon={XCircle}
            color="var(--hf-danger)"
          />
        </div>
      </div>
      <div className="flex gap-2.5">
        <div className="flex-1">
          <MetricTile
            label={t('analyticsMetricBestDay').toUpperCase()}
            value={bestDayLabel}
            sub={bestDayPct > 0 ? `${bestDayPct}%` : undefined}
            Icon={Trophy}
            color="var(--hf-warning)"
          />
        </div>
        <div className="flex-1">
          <MetricTile
            label={t('analyticsMetricStreaks').toUpperCase()}
            value={`${currentStreak}`}
            sub={bestStreak > 0 ? t('analyticsMetricStreaksSubtext') : undefined}
            Icon={TrendingUp}
            color="var(--hf-accent)"
          />
        </div>
      </div>
    </div>
  );
}

const TINT_BG: Record<string, string> = {
  'var(--hf-success)': '#22C55E1A',
  'var(--hf-danger)': '#EF44441A',
  'var(--hf-warning)': '#F59E0B1A',
  'var(--hf-accent)': '#3B82F61A',
};

function MetricTile({
  label,
  value,
  sub,
  Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: typeof CheckCircle2;
  color: string;
}) {
  return (
    <SectionCard padding="p-3.5">
      <div className="flex flex-col">
        <div
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
          style={{ backgroundColor: TINT_BG[color] || `${color}1A` }}
        >
          <Icon size={18} color={color} />
        </div>
        <span className="mt-2.5 text-hf-label-sm uppercase tracking-[0.04em] text-hf-text-tertiary leading-tight">
          {label}
        </span>
        <span className="mt-0.5 text-[24px] font-bold tracking-[-0.02em] leading-tight text-hf-text-primary">
          {value}
        </span>
        {sub && (
          <span
            className="mt-0.5 text-hf-label-sm leading-tight"
            style={{ color }}
          >
            {sub}
          </span>
        )}
      </div>
    </SectionCard>
  );
}

function BarChartCard({
  data,
  selectedIdx,
  onSelect,
  t,
}: {
  data: DayValue[];
  selectedIdx: number | null;
  onSelect: (idx: number | null) => void;
  t: (key: string) => string;
}) {
  const isWeek = data.length <= 7;
  const hasData = data.some((d) => d.value > 0);

  return (
    <SectionCard>
      <div className="flex justify-between items-baseline">
        <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
          {t('analyticsBarChartTitle')}
        </h3>
        {selectedIdx !== null && hasData && (
          <div className="text-xs leading-tight text-hf-text-secondary">
            <span>{data[selectedIdx]!.label}: </span>
            <span
              className="font-semibold"
              style={{ color: barColor(data[selectedIdx]!.value) }}
            >
              {data[selectedIdx]!.value}%
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-[130px] mt-2">
          <p className="text-xs text-hf-text-tertiary leading-tight text-center px-2">
            {t('analyticsNoData')}
          </p>
        </div>
      ) : (
        <div className="mt-3.5 h-[130px] flex items-end relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[75, 50, 25].map((p) => (
              <div
                key={p}
                className="w-full border-t border-dashed border-hf-border opacity-50"
                style={{ height: 0 }}
              />
            ))}
          </div>
          <div className="absolute left-0 -top-1 bottom-5 w-7 flex flex-col justify-between items-end pointer-events-none">
            {[75, 50, 25].map((p) => (
              <span
                key={p}
                className="text-[9px] text-hf-text-tertiary leading-none pr-1"
              >
                {p}%
              </span>
            ))}
          </div>
          <div className="flex-1 flex items-end ml-7 h-full">
            {data.map((d, i) => {
              const color = barColor(d.value);
              const dimmed = selectedIdx !== null && selectedIdx !== i;
              const barW = isWeek ? '28px' : `${Math.max(4, 92 / data.length)}%`;
              return (
                <button
                  key={i}
                  onClick={() => onSelect(selectedIdx === i ? null : i)}
                  className={`flex flex-col items-center justify-end ${isWeek ? 'flex-1' : ''}`}
                  style={{ flex: isWeek ? 1 : undefined }}
                >
                  <div
                    className="rounded-t transition-all"
                    style={{
                      width: barW,
                      height: `${Math.max(4, d.value)}%`,
                      minHeight: 4,
                      backgroundColor: color,
                      opacity: dimmed ? 0.25 : 1,
                      borderRadius: isWeek ? '5px 5px 0 0' : '2px 2px 0 0',
                      border: selectedIdx === i ? `2px solid ${color}80` : 'none',
                      borderBottom: 'none',
                    }}
                  />
                  {isWeek && (
                    <span
                      className="text-hf-label-sm leading-none mt-1.5"
                      style={{ color: selectedIdx === i ? 'var(--hf-text-primary)' : 'var(--hf-text-tertiary)' }}
                    >
                      {d.label.substring(0, 3)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasData && (
        <div className="flex justify-center gap-3 mt-3">
          <LegendDot color="var(--hf-danger)" label={t('analyticsLegendLow')} />
          <LegendDot color="var(--hf-warning)" label={t('analyticsLegendMedium')} />
          <LegendDot color="var(--hf-success)" label={t('analyticsLegendHigh')} />
        </div>
      )}
    </SectionCard>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-hf-label-sm text-hf-text-tertiary leading-tight">{label}</span>
    </div>
  );
}

function HeatmapCard({
  data,
  t,
}: {
  data: DayValue[];
  t: (key: string) => string;
}) {
  const DAY_LABELS = [
    t('habitWeekMon'),
    t('habitWeekTue'),
    t('habitWeekWed'),
    t('habitWeekThu'),
    t('habitWeekFri'),
    t('habitWeekSat'),
    t('habitWeekSun'),
  ];

  const startDay = data.length > 0 ? new Date(2024, 0, 1).getDay() : 1;
  const startPad = startDay === 0 ? 6 : startDay - 1;

  const padded: (DayValue | null)[] = [...Array(startPad).fill(null), ...data];
  const weeks: (DayValue | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <SectionCard>
      <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
        {t('analyticsHeatmapTitle')}
      </h3>
      <div className="mt-3.5 overflow-x-auto">
        <div className="flex">
          <div className="shrink-0 mt-[22px] flex flex-col gap-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[30px] w-5 flex items-center justify-end pr-0.5">
                <span className="text-[9px] font-semibold text-hf-text-tertiary leading-none">
                  {d}
                </span>
              </div>
            ))}
          </div>
          <div className="w-1 shrink-0" />
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col">
                <div className="h-[18px] flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-hf-text-tertiary leading-none">
                    {wi + 1}н
                  </span>
                </div>
                {week.map((cell, ri) => (
                  <div key={ri} className="mt-1">
                    {cell ? (
                      <div
                        className="w-[30px] h-[30px] rounded-[6px] border border-black/[0.06] flex items-center justify-center"
                        style={{ backgroundColor: heatmapColor(cell.value) }}
                      >
                        <span
                          className="text-[8px] font-bold leading-none"
                          style={{ color: cell.value >= 70 ? '#FFFFFF' : 'var(--hf-text-secondary)' }}
                        >
                          {cell.label}
                        </span>
                      </div>
                    ) : (
                      <div className="w-[30px] h-[30px]" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-[10px] text-hf-text-tertiary leading-tight">
          {t('analyticsHeatmapLess')}
        </span>
        {['#EF444433', '#EF444480', '#F59E0B80', '#22C55E80', '#22C55EE5'].map((c, i) => (
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-[3px] border border-black/[0.08]"
            style={{ backgroundColor: c }}
          />
        ))}
        <span className="text-[10px] text-hf-text-tertiary leading-tight">
          {t('analyticsHeatmapMore')}
        </span>
      </div>
    </SectionCard>
  );
}

function PieCard({
  slices,
  t,
}: {
  slices: CategorySlice[];
  t: (key: string) => string;
}) {
  if (slices.length === 0) {
    return (
      <SectionCard>
        <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
          {t('analyticsPieTitle')}
        </h3>
        <div className="flex items-center justify-center py-5">
          <p className="text-xs text-hf-text-tertiary leading-tight">
            {t('analyticsNoData')}
          </p>
        </div>
      </SectionCard>
    );
  }

  const total = slices.reduce((s, sl) => s + sl.pct, 0) || 1;
  let cumulative = 0;
  const arcs: { offset: number; dasharray: number; color: string }[] = [];
  const r = 46;
  const circumference = 2 * Math.PI * r;
  for (const sl of slices) {
    const dashLen = (sl.pct / total) * circumference;
    arcs.push({ offset: circumference - cumulative, dasharray: dashLen, color: sl.color });
    cumulative += dashLen;
  }

  return (
    <SectionCard>
      <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
        {t('analyticsPieTitle')}
      </h3>
      <div className="flex items-center gap-3 mt-3.5">
        <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
          <circle cx="50" cy="50" r="24" fill="none" stroke="var(--hf-card)" strokeWidth="2" />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r - 10}
              fill="none"
              stroke={arc.color}
              strokeWidth="38"
              strokeDasharray={`${arc.dasharray * 0.78} ${(circumference - arc.dasharray) * 0.78}`}
              strokeDashoffset={-arc.offset * 0.78}
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {slices.map((sl, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: sl.color }}
              />
              <span className="flex-1 text-[11px] text-hf-text-secondary leading-tight truncate">
                {sl.label}
              </span>
              <span className="text-xs font-semibold text-hf-text-primary leading-tight shrink-0">
                {sl.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function MoodLineCard({
  data,
  t,
}: {
  data: MoodPoint[];
  t: (key: string) => string;
}) {
  const hasData = data.some((p) => p.mood > 0 || p.energy > 0);

  return (
    <SectionCard>
      <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
        {t('analyticsMoodLineTitle')}
      </h3>
      {!hasData ? (
        <div className="flex items-center justify-center py-5">
          <p className="text-xs text-hf-text-tertiary leading-tight">
            {t('analyticsNoJournalData')}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3.5 h-[140px] flex">
            <div className="flex flex-col justify-between py-1 pr-1.5 shrink-0">
              {[10, 8, 6, 4, 2].map((v) => (
                <span
                  key={v}
                  className="text-[9px] text-hf-text-tertiary leading-none text-right"
                >
                  {v}
                </span>
              ))}
            </div>
            <div className="flex-1 h-full">
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${data.length} 10`}
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
              >
                {[2, 4, 6, 8].map((v) => (
                  <line
                    key={v}
                    x1="0"
                    y1={10 - v}
                    x2={data.length - 1}
                    y2={10 - v}
                    stroke="var(--hf-border)"
                    strokeWidth="0.08"
                    strokeDasharray="0.2 0.3"
                  />
                ))}
                {data.map((p, i) => {
                  if (p.mood <= 0 && p.energy <= 0) return null;
                  return (
                    <g key={i}>
                      {p.mood > 0 && i < data.length - 1 && (() => {
                        const nextMood = data.slice(i + 1).find((x) => x.mood > 0);
                        if (nextMood) {
                          const nextI = data.indexOf(nextMood);
                          return (
                            <line
                              x1={i}
                              y1={10 - p.mood}
                              x2={nextI}
                              y2={10 - nextMood.mood}
                              stroke="var(--hf-accent)"
                              strokeWidth="0.25"
                              strokeLinecap="round"
                            />
                          );
                        }
                        return null;
                      })()}
                      {p.energy > 0 && i < data.length - 1 && (() => {
                        const nextEnergy = data.slice(i + 1).find((x) => x.energy > 0);
                        if (nextEnergy) {
                          const nextI = data.indexOf(nextEnergy);
                          return (
                            <line
                              x1={i}
                              y1={10 - p.energy}
                              x2={nextI}
                              y2={10 - nextEnergy.energy}
                              stroke="var(--hf-warning)"
                              strokeWidth="0.25"
                              strokeLinecap="round"
                            />
                          );
                        }
                        return null;
                      })()}
                    </g>
                  );
                })}
                {data.map((p, i) => (
                  <g key={`dots-${i}`}>
                    {p.mood > 0 && (
                      <circle
                        cx={i}
                        cy={10 - p.mood}
                        r="0.35"
                        fill="var(--hf-accent)"
                        stroke="var(--hf-card)"
                        strokeWidth="0.2"
                      />
                    )}
                    {p.energy > 0 && (
                      <circle
                        cx={i}
                        cy={10 - p.energy}
                        r="0.35"
                        fill="var(--hf-warning)"
                        stroke="var(--hf-card)"
                        strokeWidth="0.2"
                      />
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>
          <div className="flex gap-4 mt-2 ml-6">
            <LineLegend color="var(--hf-accent)" label={t('analyticsMoodLine')} />
            <LineLegend color="var(--hf-warning)" label={t('analyticsEnergyLine')} />
          </div>
        </>
      )}
    </SectionCard>
  );
}

function LineLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-[3px] rounded-[2px]"
        style={{ backgroundColor: color }}
      />
      <span className="text-hf-label-sm text-hf-text-secondary leading-tight">
        {label}
      </span>
    </div>
  );
}

function TopHabitsCard({
  habits,
  t,
}: {
  habits: TopHabit[];
  t: (key: string) => string;
}) {
  return (
    <SectionCard>
      <div className="flex justify-between items-baseline">
        <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
          {t('analyticsTopHabitsTitle')}
        </h3>
        <span className="text-hf-label-sm uppercase tracking-[0.05em] text-hf-text-tertiary leading-tight">
          {t('analyticsTopHabitsSubtitle')}
        </span>
      </div>
      {habits.length === 0 ? (
        <div className="flex items-center justify-center py-5">
          <p className="text-xs text-hf-text-tertiary leading-tight">
            {t('analyticsNoData')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 mt-3.5">
          {habits.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-hf-bg-tertiary flex items-center justify-center shrink-0">
                <span className="text-hf-label-sm text-hf-text-tertiary leading-none">
                  {i + 1}
                </span>
              </div>
              <span className="text-[18px] leading-none shrink-0">{h.emoji}</span>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-[13px] font-semibold text-hf-text-primary leading-tight truncate">
                    {h.name}
                  </span>
                  <span
                    className="text-sm font-semibold leading-tight ml-2 shrink-0"
                    style={{ color: h.color }}
                  >
                    {h.pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-hf-full bg-hf-bg-tertiary overflow-hidden pb-tg-safe-bottom">
                  <div
                    className="h-full rounded-hf-full transition-all"
                    style={{
                      width: `${Math.min(100, h.pct)}%`,
                      backgroundColor: h.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function AiCorrelationsCard({ t }: { t: (key: string) => string }) {
  return (
    <SectionCard>
      <div className="flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-hf-bg-tertiary flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-hf-text-tertiary" />
        </div>
        <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
          {t('analyticsAiCorrelationsTitle')}
        </h3>
      </div>
      <p className="mt-3 text-xs text-hf-text-secondary leading-relaxed">
        {t('analyticsAiCorrelationsMessage')}
      </p>
      <button className="mt-3.5 w-full py-[11px] rounded-hf-md bg-hf-accent flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform">
        <Sparkles size={15} className="text-white" />
        <span className="text-hf-label-lg text-white leading-tight">
          {t('correlationsRefresh')}
        </span>
      </button>
    </SectionCard>
  );
}
