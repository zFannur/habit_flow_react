import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useHabitsQuery, useLogsQuery, dateOnly, parseLocalDate, currentStreak as calcCurrentStreak } from '@/entities/habit';
import { useJournalEntriesQuery } from '@/entities/journal';
import type { JournalEntryModel } from '@/entities/journal';
import { OpenRouterClient } from '@/shared/api/openrouter/client';
import { Env } from '@/shared/config/env';
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
  CalendarCheck,
  Check,
  X,
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reviewVisible, setReviewVisible] = useState(() => searchParams.get('review') === '1');

  useEffect(() => {
    if (searchParams.get('review') === '1') setReviewVisible(true);
  }, [searchParams]);

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

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return dateOnly(d);
  }, [today]);
  const todayStr = useMemo(() => dateOnly(today), [today]);
  const { data: allLogs30 } = useLogsQuery(userId, thirtyDaysAgo, todayStr);
  const allLogs30Arr = useMemo(() => allLogs30 || [], [allLogs30]);

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
      const start = parseLocalDate(range.from);
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
    const start = parseLocalDate(range.from);
    const daysCount = parseLocalDate(range.to).getDate() - start.getDate() + 1;
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
      const start = parseLocalDate(range.from);
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
    const start = parseLocalDate(range.from);
    const daysCount = parseLocalDate(range.to).getDate() - start.getDate() + 1;
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
    const habitCat = new Map(habitsArr.map((h) => [h.id, h.category || t('analyticsCategoryGeneral')]));
    for (const l of logsInRange) {
      const cat = habitCat.get(l.habit_id) || t('analyticsCategoryGeneral');
      const entry = catMap.get(cat) || { done: 0, total: 0 };
      if (l.status === 'done' || l.status === 'partial') entry.done++;
      if (l.status === 'done' || l.status === 'partial' || l.status === 'missed') entry.total++;
      catMap.set(cat, entry);
    }
    // Sort by attempt volume (total logs), take top 5
    const sorted = [...catMap.entries()]
      .map(([label, v]) => ({ label: label || '—', total: v.total, done: v.done }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const totalAttempts = sorted.reduce((s, e) => s + e.total, 0);
    if (totalAttempts === 0) return [];
    // Distribute slice sizes by attempt volume; last slice absorbs rounding so sum == 100
    const result: CategorySlice[] = [];
    let sumSoFar = 0;
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i]!;
      const pct = i === sorted.length - 1
        ? 100 - sumSoFar
        : Math.round((s.total / totalAttempts) * 100);
      sumSoFar += pct;
      result.push({
        label: s.label,
        pct,
        color: CHART_PALETTE[i % CHART_PALETTE.length] || '#3B82F6',
      });
    }
    return result;
  }, [habitsArr, logsInRange, t]);

  const bestDayLabel = useMemo(() => {
    const byDow = new Map<number, { done: number; total: number }>();
    for (const l of logsInRange) {
      const d = parseLocalDate(l.log_date);
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

  // allLogs30Arr covers 30 days; streaks > 30 days show as "30+" in the UI.
  // This is the minimal correct solution: we avoid an extra deep query while
  // still getting accurate skipped-aware counts via the canonical helper.
  const allLogs30Map = useMemo(() => {
    const map = new Map<string, typeof allLogs30Arr>();
    for (const l of allLogs30Arr) {
      const arr = map.get(l.habit_id) || [];
      arr.push(l);
      map.set(l.habit_id, arr);
    }
    return map;
  }, [allLogs30Arr]);

  const currentStreak = useMemo(() => {
    let maxStreak = 0;
    for (const h of habitsArr) {
      const hLogs = allLogs30Map.get(h.id) || [];
      const streak = calcCurrentStreak({ habit: h, logs: hLogs, today });
      if (streak > maxStreak) maxStreak = streak;
    }
    return maxStreak;
  }, [habitsArr, allLogs30Map, today]);

  const bestStreak = useMemo(() => {
    // Walk 30-day logs per habit to find best run (done/partial count, skipped neutral, missed resets).
    let globalBest = 0;
    for (const h of habitsArr) {
      const hLogs = (allLogs30Map.get(h.id) || []).slice().sort((a, b) =>
        a.log_date.localeCompare(b.log_date),
      );
      let run = 0;
      let localBest = 0;
      for (const l of hLogs) {
        if (l.status === 'done' || l.status === 'partial') {
          run++;
          if (run > localBest) localBest = run;
        } else if (l.status === 'skipped') {
          // neutral — keep the run
        } else if (l.status === 'missed') {
          run = 0;
        }
      }
      if (localBest > globalBest) globalBest = localBest;
    }
    return globalBest;
  }, [habitsArr, allLogs30Map]);

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
              const text = `📊 ${t('appTitle')} · ${periodLabel}\n✅ ${doneCount} ${t('analyticsMetricCompleted')} · ❌ ${missedCount} ${t('analyticsMetricSkipped')}\n🎯 ${completionPct}%`;
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
        {reviewVisible && (
          <WeeklyReviewChecklist onDismiss={() => setReviewVisible(false)} t={t} />
        )}

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
          <HeatmapCard data={barData} rangeFrom={range.from} t={t} />
        )}

        <PieCard slices={pieSlices} t={t} />

        <MoodLineCard data={moodData} t={t} />

        <TopHabitsCard habits={topHabits} t={t} />

        <AiCorrelationsCard
          t={t}
          habits={habitsArr}
          logs={allLogs30Arr}
          entries={entriesArr}
          navigate={navigate}
        />
      </div>
    </div>
  );
}

function SectionCard({
  children,
  padding = 'p-4',
  bg,
}: {
  children: React.ReactNode;
  padding?: string;
  bg?: string;
}) {
  return (
    <div
      className={`rounded-hf-lg border border-hf-border shadow-hf-card ${bg || 'bg-hf-card'} ${padding}`}
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
            value={currentStreak >= 30 ? '30+' : `${currentStreak}`}
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
  rangeFrom,
  t,
}: {
  data: DayValue[];
  rangeFrom: string;
  t: (key: string, params?: Record<string, string | number>) => string;
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

  // Use real start-of-period date for correct Mon-based padding
  const periodStart = data.length > 0 ? parseLocalDate(rangeFrom) : new Date(2024, 0, 1);
  const rawDay = periodStart.getDay(); // 0=Sun … 6=Sat
  const startPad = rawDay === 0 ? 6 : rawDay - 1; // Mon=0 … Sun=6

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
            {weeks.map((week, wi) => {
              // Label = day-of-month of the first real day in this week column
              const weekStartDate = new Date(periodStart);
              weekStartDate.setDate(periodStart.getDate() + wi * 7 - startPad);
              // Clamp to start of period so padding weeks don't show negative dates
              const labelDate = wi === 0 ? periodStart : weekStartDate;
              const weekLabel = `${labelDate.getDate()}`;
              return (
              <div key={wi} className="flex flex-col">
                <div className="h-[18px] flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-hf-text-tertiary leading-none">
                    {weekLabel}
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
              );
            })}
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
        <EmptyPlaceholder />
      </SectionCard>
    );
  }

  const total = slices.reduce((s, sl) => s + sl.pct, 0) || 1;
  let cumulative = 0;
  const arcs: { offset: number; dasharray: number; color: string }[] = [];
  const r = 39;
  const circumference = 2 * Math.PI * r;
  for (const sl of slices) {
    const dashLen = (sl.pct / total) * circumference;
    arcs.push({ offset: cumulative, dasharray: dashLen, color: sl.color });
    cumulative += dashLen;
  }

  return (
    <SectionCard>
      <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
        {t('analyticsPieTitle')}
      </h3>
      <div className="flex items-center gap-3 mt-3.5">
        <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="22"
              strokeDasharray={`${arc.dasharray} ${circumference - arc.dasharray}`}
              strokeDashoffset={-arc.offset}
              transform="rotate(-90 60 60)"
            />
          ))}
        </svg>

        <div className="flex-1 flex flex-col gap-[7px] min-w-0">
          {slices.map((sl, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: sl.color }}
              />
              <span className="flex-1 text-xs text-hf-text-secondary leading-tight truncate">
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
        <EmptyPlaceholder />
      ) : (
        <>
          <div className="mt-3.5 flex flex-col" style={{ height: 140 }}>
            {/* Chart area: Y-axis + SVG in same-height flex row */}
            <div className="flex flex-1 min-h-0">
              <div className="w-5 relative shrink-0 mr-1.5">
                {[10, 7, 5, 3].map((v) => {
                  const topPct = (10 - v) * 10;
                  return (
                    <span
                      key={v}
                      className="absolute right-0 text-[9px] text-hf-text-tertiary leading-none text-right -translate-y-1/2"
                      style={{ top: `${topPct}%` }}
                    >
                      {v}
                    </span>
                  );
                })}
              </div>
              <div className="flex-1 relative h-full">
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${Math.max(1, data.length - 1)} 10`}
                  preserveAspectRatio="none"
                  className="overflow-visible"
                >
                  {[3, 5, 7, 10].map((v) => (
                    <line
                      key={v}
                      x1="0"
                      y1={10 - v}
                      x2={Math.max(1, data.length - 1)}
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
            {/* X-axis labels row, offset left by Y-axis width */}
            <div className="relative h-3 mt-1.5 ml-[26px]">
              {data.map((p, i) => {
                const leftPct = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                return (
                  <span
                    key={i}
                    className="absolute text-[9px] text-hf-text-tertiary leading-none -translate-x-1/2"
                    style={{ left: `${leftPct}%` }}
                  >
                    {p.label}
                  </span>
                );
              })}
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
        <EmptyPlaceholder />
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
                <div className="h-1.5 rounded-hf-full bg-hf-bg-tertiary overflow-hidden">
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

interface CorrelationInsight {
  habit: string;
  factor: string;
  direction: 'up' | 'down' | 'mixed';
  strength: number;
  note?: string;
}

const systemPrompt = `You analyse a user's habit-tracker data and return correlations as strict JSON.
Output JSON only, no prose, no markdown fences. Schema:
{"insights":[{"habit":string,"factor":string,"direction":"up"|"down"|"mixed","strength":number,"note":string}]}
- "habit" must be one of the habit names in the input.
- "factor" describes the contextual signal (e.g. "weekend", "morning", "mood<=4", "after_journal").
- "direction" is up if doing the habit correlates with a positive change in factor, down for negative, mixed otherwise.
- "strength" is 0..1 confidence.
- Return at most 5 insights, prioritise high-strength ones.
- If signal is too weak, return {"insights":[]}.`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPrompt(habits: any[], logs: any[], journal: any[]) {
  const names = new Map(habits.map((h) => [h.id, h.name]));
  let buf = 'Habits:\n';
  for (const h of habits) {
    buf += `- ${h.name} [${h.habit_type}]\n`;
  }
  buf += `\nLogs (${logs.length}, last 30 days):\ndate | habit | status | value\n`;
  for (const l of logs) {
    const name = names.get(l.habit_id) || l.habit_id;
    const v = l.value !== undefined && l.value !== null ? l.value : '';
    buf += `${l.log_date} | ${name} | ${l.status} | ${v}\n`;
  }
  if (journal.length > 0) {
    buf += `\nJournal mood/energy (${journal.length}):\ndate | mood | energy\n`;
    const sortedJournal = [...journal]
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
      .slice(0, 30);
    for (const e of sortedJournal) {
      const m = e.mood !== undefined && e.mood !== null ? e.mood : '-';
      const en = e.energy !== undefined && e.energy !== null ? e.energy : '-';
      buf += `${e.entry_date} | ${m} | ${en}\n`;
    }
  }
  buf += '\nReturn correlations as JSON per the system schema.\n';
  return buf;
}

function parseResponse(raw: string): CorrelationInsight[] {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return [];
  }
  const slice = raw.substring(start, end + 1);
  try {
    const decoded = JSON.parse(slice);
    if (!decoded || typeof decoded !== 'object') return [];
    const list = decoded.insights;
    if (!Array.isArray(list)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.map((item: any) => {
      const strengthRaw = item.strength;
      let strength = typeof strengthRaw === 'number' ? strengthRaw : 0.5;
      strength = Math.max(0.0, Math.min(1.0, strength));
      return {
        habit: String(item.habit || ''),
        factor: String(item.factor || ''),
        direction: (item.direction === 'up' || item.direction === 'down') ? item.direction : 'mixed',
        strength,
        note: item.note ? String(item.note) : undefined,
      };
    });
  } catch {
    return [];
  }
}

function InsightTile({ insight, t }: { insight: CorrelationInsight; t: (key: string) => string }) {
  const dirLabel =
    insight.direction === 'up'
      ? t('correlationsDirectionUp')
      : insight.direction === 'down'
        ? t('correlationsDirectionDown')
        : t('correlationsDirectionMixed');

  const dirColorClass =
    insight.direction === 'up'
      ? 'text-hf-success'
      : insight.direction === 'down'
        ? 'text-hf-danger'
        : 'text-hf-text-tertiary';

  return (
    <div className="p-[14px_14px_12px_14px] bg-hf-card rounded-hf-md border border-hf-border flex flex-col gap-1.5">
      <div className="flex justify-between items-start gap-2">
        <span className="flex-1 text-[14px] font-semibold text-hf-text-primary leading-snug">
          {insight.habit} · {insight.factor}
        </span>
        <span className="text-[12px] font-medium text-hf-text-tertiary leading-none shrink-0 mt-0.5">
          {Math.round(insight.strength * 100)}%
        </span>
      </div>
      <span className={`text-[12px] font-medium leading-none ${dirColorClass}`}>
        {dirLabel}
      </span>
      {insight.note && insight.note.trim() && (
        <p className="text-[12.5px] text-hf-text-secondary leading-normal mt-0.5">
          {insight.note}
        </p>
      )}
    </div>
  );
}

function PrimaryRefreshButton({ label, onTap }: { label: string; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="mt-3.5 w-full py-[11px] rounded-hf-md bg-hf-accent flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform text-white border-0 cursor-pointer"
    >
      <Sparkles size={15} className="text-white" />
      <span className="text-hf-label-lg font-semibold text-white leading-tight">
        {label}
      </span>
    </button>
  );
}

function EmptyPlaceholder() {
  return (
    <div className="py-4 flex items-center justify-center">
      <span className="text-[20px] font-medium text-hf-text-tertiary leading-none">—</span>
    </div>
  );
}

function CheckItem({ label, checked, onTap }: { label: string; checked: boolean; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="flex items-center gap-3 w-full text-left py-1.5 px-1 rounded-hf-md active:opacity-90 transition-opacity border-0 bg-transparent cursor-pointer"
    >
      <div
        className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-all duration-120 shrink-0 ${
          checked
            ? 'bg-hf-success border-hf-success text-white'
            : 'bg-transparent border-hf-border'
        }`}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      </div>
      <span
        className={`text-xs leading-snug transition-colors duration-120 ${
          checked ? 'text-hf-text-tertiary' : 'text-hf-text-primary'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function WeeklyReviewChecklist({ onDismiss, t }: { onDismiss: () => void; t: (key: string) => string }) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false]);

  const items = [
    t('weeklyReviewItemStreak'),
    t('weeklyReviewItemCorrelations'),
    t('weeklyReviewItemGoals'),
  ];

  return (
    <SectionCard bg="bg-hf-bg-secondary" padding="p-4">
      <div className="flex items-center gap-[10px]">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-hf-warning/12 flex items-center justify-center shrink-0">
          <CalendarCheck size={18} className="text-hf-warning" />
        </div>
        <h3 className="flex-1 text-[15px] font-semibold text-hf-text-primary leading-tight">
          {t('weeklyReviewTitle')}
        </h3>
        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded-md flex items-center justify-center active:scale-95 transition-transform border-0 bg-transparent cursor-pointer"
        >
          <X size={16} className="text-hf-text-tertiary" />
        </button>
      </div>

      <p className="mt-2 text-xs text-hf-text-secondary leading-relaxed">
        {t('weeklyReviewSubtitle')}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {items.map((item, idx) => (
          <CheckItem
            key={idx}
            label={item}
            checked={checked[idx] || false}
            onTap={() => {
              const newChecked = [...checked];
              newChecked[idx] = !newChecked[idx];
              setChecked(newChecked);
            }}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function AiCorrelationsCard({
  t,
  habits,
  logs,
  entries,
  navigate,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  habits: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: any[];
  navigate: (path: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'data' | 'error'>('idle');
  const [insights, setInsights] = useState<CorrelationInsight[]>([]);
  const [errType, setErrType] = useState<'no_key' | 'not_enough_data' | 'rate_limited' | 'generic' | null>(null);

  const handleFetchCorrelations = useCallback(async () => {
    setStatus('loading');
    setErrType(null);

    try {
      const key = localStorage.getItem('openrouter_key') || '';
      if (!key) {
        setErrType('no_key');
        setStatus('error');
        return;
      }

      if (logs.length < 7) {
        setErrType('not_enough_data');
        setStatus('error');
        return;
      }

      const prompt = buildPrompt(habits, logs, entries);
      const client = new OpenRouterClient(key);

      const responseText = await client.chatCompletionNonStream(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        Env.defaultModel
      );

      const parsed = parseResponse(responseText);
      setInsights(parsed);
      setStatus('data');
    } catch (e) {
      console.error('Failed to fetch correlations:', e);
      const msg = String((e as Error)?.message || e || '');
      if (msg.includes('429')) {
        setErrType('rate_limited');
      } else {
        setErrType('generic');
      }
      setStatus('error');
    }
  }, [habits, logs, entries]);

  let content = null;

  if (status === 'idle') {
    content = (
      <>
        <p className="mt-3 text-xs text-hf-text-secondary leading-relaxed">
          {t('analyticsAiCorrelationsMessage')}
        </p>
        <PrimaryRefreshButton label={t('correlationsRefresh')} onTap={handleFetchCorrelations} />
      </>
    );
  } else if (status === 'loading') {
    content = (
      <div className="flex items-center gap-3 py-2 mt-3">
        <div className="w-[18px] h-[18px] border-2 border-hf-accent border-t-transparent rounded-full animate-spin shrink-0" />
        <span className="text-xs text-hf-text-secondary leading-normal">
          {t('correlationsLoading')}
        </span>
      </div>
    );
  } else if (status === 'error') {
    const errInfo = (() => {
      if (errType === 'no_key') {
        return { msg: t('correlationsNoKey'), label: t('aiSettingsApiKeySection'), action: () => navigate('/profile/ai-settings') };
      } else if (errType === 'not_enough_data') {
        return { msg: t('correlationsNotEnoughData', { count: logs.length }), label: t('correlationsRefreshAgain'), action: handleFetchCorrelations };
      } else if (errType === 'rate_limited') {
        return { msg: t('correlationsRateLimited'), label: t('correlationsRefreshAgain'), action: handleFetchCorrelations };
      } else {
        return { msg: t('correlationsGeneric'), label: t('correlationsRefreshAgain'), action: handleFetchCorrelations };
      }
    })();

    content = (
      <>
        <p className="mt-3 text-xs text-hf-text-secondary leading-relaxed">
          {errInfo.msg}
        </p>
        <PrimaryRefreshButton label={errInfo.label} onTap={errInfo.action} />
      </>
    );
  } else if (status === 'data') {
    if (insights.length === 0) {
      content = (
        <>
          <p className="mt-3 text-xs text-hf-text-secondary leading-relaxed">
            {t('correlationsEmpty')}
          </p>
          <PrimaryRefreshButton label={t('correlationsRefreshAgain')} onTap={handleFetchCorrelations} />
        </>
      );
    } else {
      content = (
        <>
          <div className="flex flex-col gap-2 mt-3">
            {insights.map((insight, idx) => (
              <InsightTile key={idx} insight={insight} t={t} />
            ))}
          </div>
          <PrimaryRefreshButton label={t('correlationsRefreshAgain')} onTap={handleFetchCorrelations} />
        </>
      );
    }
  }

  return (
    <SectionCard bg="bg-hf-bg-secondary">
      <div className="flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-hf-bg-tertiary flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-hf-text-tertiary" />
        </div>
        <h3 className="text-[15px] font-semibold text-hf-text-primary leading-tight">
          {t('analyticsAiCorrelationsTitle')}
        </h3>
      </div>
      {content}
    </SectionCard>
  );
}
