import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useJournalEntriesQuery } from '@/entities/journal';
import { EmptyState, Button, Chip } from '@/shared/ui';
import { Plus } from 'lucide-react';

type FilterType = 'all' | 'month' | 'lowMood' | 'highMood';

const FILTERS: { id: FilterType; key: string }[] = [
  { id: 'all', key: 'journalListFilterAll' },
  { id: 'month', key: 'journalListFilterMonth' },
  { id: 'lowMood', key: 'journalListFilterLowMood' },
  { id: 'highMood', key: 'journalListFilterHighMood' },
];

function moodColor(mood: number | undefined): string {
  if (mood === undefined) return '#9AA0AB';
  if (mood <= 3) return '#EF4444';
  if (mood <= 6) return '#F59E0B';
  return '#22C55E';
}

function moodEmoji(mood: number | undefined): string {
  if (mood === undefined) return '😐';
  if (mood <= 2) return '😢';
  if (mood <= 4) return '😕';
  if (mood <= 6) return '😐';
  if (mood <= 8) return '🙂';
  return '😊';
}

function energyDots(energy: number | undefined): number {
  if (energy === undefined) return 0;
  return Math.round(energy / 2);
}

function formatDateShort(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d);
  } catch {
    return dateStr;
  }
}

export default function JournalListPage() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [filter, setFilter] = useState<FilterType>('all');

  const { data: entries, isLoading } = useJournalEntriesQuery(userId);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    let list = [...entries];

    if (filter === 'month') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      list = list.filter((e) => {
        const d = new Date(e.entry_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (filter === 'lowMood') {
      list = list.filter((e) => e.mood !== undefined && e.mood <= 4);
    } else if (filter === 'highMood') {
      list = list.filter((e) => e.mood !== undefined && e.mood >= 7);
    }

    list.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
    return list;
  }, [entries, filter]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="h-[28px] w-[100px] bg-hf-bg-secondary animate-pulse rounded mb-4" />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-hf-bg-secondary animate-pulse rounded-hf-full" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[88px] bg-hf-bg-secondary animate-pulse rounded-hf-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      <div className="p-4 bg-hf-bg-primary shrink-0">
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-hf-text-primary">
          {t('journalListTitle')}
        </h2>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 shrink-0 scrollbar-none">
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={t(f.key)}
            selected={filter === f.id}
            onTap={() => setFilter(f.id)}
          />
        ))}
      </div>

      <div className="flex-1 px-4 pb-24">
        {filteredEntries.length === 0 ? (
          <div className="py-16">
            <EmptyState
              emoji="📝"
              title={t('emptyTitleNoEntries')}
              description={t('emptyDescNoEntries')}
              action={
                <Button
                  label={t('emptyActionNoEntries')}
                  onClick={() => navigate('/journal/new')}
                />
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/journal/${entry.entry_date}`)}
                className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card p-4 flex items-center gap-4 cursor-pointer hover:opacity-[0.98] active:scale-[0.99] transition-all"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: moodColor(entry.mood) }}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-hf-body-sm text-hf-text-secondary leading-tight">
                    {formatDateShort(entry.entry_date, locale)}
                  </p>
                  <p className="text-hf-body-md text-hf-text-primary mt-0.5 line-clamp-2 leading-relaxed">
                    {entry.free_text ? entry.free_text.replace(/###.*?\n/g, '').substring(0, 120) : ''}
                  </p>
                  {entry.mood !== undefined && (
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[12px] text-hf-text-secondary">
                      <span>{moodEmoji(entry.mood)}</span>
                      <span>{entry.mood}/10</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 self-end">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-3 rounded-[2px] ${
                        i < energyDots(entry.energy) ? 'bg-amber-500' : 'bg-hf-bg-tertiary'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/journal/new')}
        className="fixed right-5 bottom-24 w-14 h-14 rounded-full bg-hf-accent text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-[0.95] transition-all z-10"
        style={{ boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' }}
      >
        <Plus className="w-6 h-6 stroke-[2px]" />
      </button>
    </div>
  );
}
