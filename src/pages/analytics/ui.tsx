import { useState, useMemo } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useHabitsQuery, useLogsQuery, dateOnly } from '@/entities/habit';
import { useJournalEntriesQuery } from '@/entities/journal';
import { BarChart3, LineChart, PieChart, CheckCircle2, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // Tabs: 'week' | 'month'
  const [periodTab, setPeriodTab] = useState<'week' | 'month'>('week');

  // Weekly review checklist local states
  const [reviewStreak, setReviewStreak] = useState(false);
  const [reviewCorrelations, setReviewCorrelations] = useState(false);
  const [reviewGoals, setReviewGoals] = useState(false);

  // Date ranges
  const today = useMemo(() => new Date(), []);
  const todayStr = dateOnly(today);

  const fromDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() - (periodTab === 'week' ? 6 : 29));
    return dateOnly(d);
  }, [periodTab, today]);

  // Queries
  const { data: habits } = useHabitsQuery(userId);
  const { data: logs } = useLogsQuery(userId, fromDate, todayStr);
  const { data: journalEntries } = useJournalEntriesQuery(userId);

  // 1. Calculate General Completion Stats
  const stats = useMemo(() => {
    if (!logs || !habits) return { completed: 0, missed: 0, skipped: 0, rate: 0 };
    let completed = 0;
    let missed = 0;
    let skipped = 0;

    logs.forEach((log) => {
      if (log.status === 'done' || log.status === 'partial') completed++;
      else if (log.status === 'missed') missed++;
      else if (log.status === 'skipped') skipped++;
    });

    const total = completed + missed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, missed, skipped, rate };
  }, [logs, habits]);

  // 2. Prepare Completion By Day Bar Chart Data
  const barChartData = useMemo(() => {
    const daysCount = periodTab === 'week' ? 7 : 30;
    const list = [];
    const dateCursor = new Date(today);
    dateCursor.setDate(today.getDate() - (daysCount - 1));

    // Index logs by date
    const logsByDate = logs?.reduce((acc, log) => {
      const arr = acc[log.log_date] || [];
      arr.push(log);
      acc[log.log_date] = arr;
      return acc;
    }, {} as Record<string, typeof logs>) || {};


    for (let i = 0; i < daysCount; i++) {
      const dStr = dateOnly(dateCursor);
      const dayLogs = logsByDate[dStr] || [];
      const completed = dayLogs.filter((l) => l.status === 'done' || l.status === 'partial').length;
      const missed = dayLogs.filter((l) => l.status === 'missed').length;
      
      const total = completed + missed;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      let label: string;
      try {
        label = new Intl.DateTimeFormat(locale, {
          weekday: 'short',
          day: 'numeric',
        }).format(dateCursor);
      } catch {
        label = dStr.substring(5);
      }

      list.push({ dateStr: dStr, label, rate });
      dateCursor.setDate(dateCursor.getDate() + 1);
    }
    return list;
  }, [logs, periodTab, today, locale]);

  // 3. Prepare Category Pie/Donut Chart Data
  const categoryData = useMemo(() => {
    if (!logs || !habits) return [];
    
    // Map habitId to Category
    const categoryMap = habits.reduce((acc, h) => {
      acc[h.id] = h.category || 'General';
      return acc;
    }, {} as Record<string, string>);

    const counts: Record<string, { completed: number; total: number }> = {};

    logs.forEach((log) => {
      const cat = categoryMap[log.habit_id] || 'General';
      if (!counts[cat]) {
        counts[cat] = { completed: 0, total: 0 };
      }
      if (log.status === 'done' || log.status === 'partial') {
        counts[cat].completed++;
      }
      if (log.status === 'done' || log.status === 'partial' || log.status === 'missed') {
        counts[cat].total++;
      }
    });

    return Object.entries(counts).map(([name, val]) => ({
      name,
      completed: val.completed,
      rate: val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0,
    })).sort((a, b) => b.completed - a.completed);
  }, [logs, habits]);

  // 4. Prepare Mood and Energy Line Chart Data
  const lineChartData = useMemo(() => {
    if (!journalEntries) return [];
    const daysCount = periodTab === 'week' ? 7 : 30;
    const list = [];
    const dateCursor = new Date(today);
    dateCursor.setDate(dateCursor.getDate() - (daysCount - 1));

    // Index entries by date
    const entriesByDate = journalEntries.reduce((acc, entry) => {
      acc[entry.entry_date] = entry;
      return acc;
    }, {} as Record<string, typeof journalEntries[0]>);

    for (let i = 0; i < daysCount; i++) {
      const dStr = dateOnly(dateCursor);
      const entry = entriesByDate[dStr];

      let label: string;
      try {
        label = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
        }).format(dateCursor);
      } catch {
        label = dStr.substring(5);
      }

      list.push({
        dateStr: dStr,
        label,
        mood: entry?.mood || 0,
        energy: entry?.energy || 0,
      });
      dateCursor.setDate(dateCursor.getDate() + 1);
    }
    return list;
  }, [journalEntries, periodTab, today, locale]);

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-hf-bg-primary shrink-0">
        <h2 className="text-[22px] font-bold tracking-tight text-hf-text-primary">
          {t('analyticsTitle')}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-hf-bg-secondary border-b border-hf-border/10 p-2 shrink-0">
        <button
          onClick={() => setPeriodTab('week')}
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${
            periodTab === 'week' ? 'bg-hf-bg-primary text-hf-accent shadow-sm' : 'text-hf-text-secondary'
          }`}
        >
          {t('analyticsWeekTab')}
        </button>
        <button
          onClick={() => setPeriodTab('month')}
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${
            periodTab === 'month' ? 'bg-hf-bg-primary text-hf-accent shadow-sm' : 'text-hf-text-secondary'
          }`}
        >
          {t('analyticsMonthTab')}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* Stats Overview */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-hf-text-secondary font-bold uppercase tracking-wider">
              {t('analyticsSummaryLabel')}
            </span>
            <span className="text-3xl font-extrabold text-hf-accent">
              {stats.rate}%
            </span>
            <span className="text-[11px] text-hf-text-secondary mt-1">
              {stats.completed} {t('analyticsMetricCompleted')} · {stats.missed} {t('analyticsMetricSkipped')}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-hf-accent/8 border border-hf-accent/15 px-3 py-1.5 rounded-full text-hf-accent text-[12px] font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {periodTab === 'week' ? t('analyticsTrendUpWeek', { percent: 0 }) : t('analyticsTrendUpMonth', { percent: 0 })}
            </span>
          </div>
        </div>

        {/* Completion Bar Chart (Custom SVG) */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-hf-accent" />
            {t('analyticsBarChartTitle')}
          </h3>

          <div className="w-full h-44 flex items-end justify-between gap-1.5 pt-4">
            {barChartData.map((d, i) => {
              let barColor = 'bg-hf-danger';
              if (d.rate >= 70) barColor = 'bg-hf-success';
              else if (d.rate >= 40) barColor = 'bg-hf-warning';

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full relative group flex flex-col justify-end h-full">
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-hf-bg-secondary text-[10px] font-bold px-2 py-0.5 rounded border border-hf-border/20 shadow z-10">
                      {d.rate}%
                    </div>
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t ${barColor} min-h-[4px] transition-all duration-500`}
                      style={{ height: `${Math.max(4, d.rate)}%` }}
                    />
                  </div>
                  {periodTab === 'week' && (
                    <span className="text-[9px] font-semibold text-hf-text-secondary">
                      {d.label.substring(0, 3)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center text-[10px] text-hf-text-secondary font-medium border-t border-hf-border/10 pt-3 mt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-hf-success inline-block" />
              {t('analyticsLegendHigh')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-hf-warning inline-block" />
              {t('analyticsLegendMedium')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-hf-danger inline-block" />
              {t('analyticsLegendLow')}
            </span>
          </div>
        </div>

        {/* Mood & Energy Line Chart (Custom SVG) */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <LineChart className="w-4 h-4 text-orange-500" />
            {t('analyticsMoodLineTitle')}
          </h3>

          <div className="w-full h-40 pt-4 relative">
            {/* Custom SVG line plot */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="var(--hf-text-secondary, rgba(0,0,0,0.05))" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="var(--hf-text-secondary, rgba(0,0,0,0.05))" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="var(--hf-text-secondary, rgba(0,0,0,0.05))" strokeWidth="0.5" strokeDasharray="2" />

              {/* Mood Line */}
              {lineChartData.length > 1 && (
                <path
                  d={lineChartData
                    .map((d, idx) => {
                      const x = (idx / (lineChartData.length - 1)) * 100;
                      // mood scale 1-10 mapped to SVG Y 100-0
                      const y = 100 - (d.mood * 10);
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="var(--hf-accent, #2481cc)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Energy Line */}
              {lineChartData.length > 1 && (
                <path
                  d={lineChartData
                    .map((d, idx) => {
                      const x = (idx / (lineChartData.length - 1)) * 100;
                      const y = 100 - (d.energy * 10);
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>

          <div className="flex gap-4 justify-center text-[10px] text-hf-text-secondary font-medium border-t border-hf-border/10 pt-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-hf-accent inline-block" />
              {t('analyticsMoodLine')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" />
              {t('analyticsEnergyLine')}
            </span>
          </div>
        </div>

        {/* Category Breakdown list */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-hf-success" />
            {t('analyticsPieTitle')}
          </h3>

          <div className="flex flex-col gap-3 mt-1">
            {categoryData.length === 0 ? (
              <span className="text-[12px] text-hf-text-secondary italic">No data yet</span>
            ) : (
              categoryData.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-[13px]">
                  <div className="flex justify-between font-semibold">
                    <span>{cat.name}</span>
                    <span className="text-hf-accent">{cat.rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-hf-bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-hf-success rounded-full transition-all duration-500"
                      style={{ width: `${cat.rate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Review Checklist (collapsible or card) */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-hf-text-primary">
              <CheckCircle2 className="w-4.5 h-4.5 text-hf-accent" />
              {t('weeklyReviewTitle')}
            </h3>
            <p className="text-[11px] text-hf-text-secondary mt-1 leading-snug">
              {t('weeklyReviewSubtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            {[
              { checked: reviewStreak, setChecked: setReviewStreak, label: t('weeklyReviewItemStreak') },
              { checked: reviewCorrelations, setChecked: setReviewCorrelations, label: t('weeklyReviewItemCorrelations') },
              { checked: reviewGoals, setChecked: setReviewGoals, label: t('weeklyReviewItemGoals') },
            ].map((item, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-hf-text-primary">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.setChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-hf-border/25 accent-hf-accent cursor-pointer"
                />
                <span className={item.checked ? 'line-through text-hf-text-secondary' : ''}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
