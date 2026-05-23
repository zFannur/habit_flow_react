import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import { useJournalEntriesQuery, type JournalEntryModel } from '@/entities/journal';
import { EmptyState, Button } from '@/shared/ui';
import { Search, Plus } from 'lucide-react';
import { dateOnly } from '@/entities/habit';

type FilterType = 'all' | 'month' | 'lowMood' | 'highMood';

export default function JournalListPage() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // Local state
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Query
  const { data: entries, isLoading } = useJournalEntriesQuery(userId);

  const calculateStreak = (entriesList: JournalEntryModel[]): number => {
    if (!entriesList.length) return 0;
    const dates = new Set(entriesList.map((e) => e.entry_date));
    let streak = 0;
    const current = new Date();
    
    // Check starting from today or yesterday
    const checkDate = new Date(current);
    let checkStr = dateOnly(checkDate);
    
    if (!dates.has(checkStr)) {
      // If today is empty, check starting from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = dateOnly(checkDate);
    }
    
    while (dates.has(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = dateOnly(checkDate);
    }
    return streak;
  };

  const getFilteredEntries = () => {
    if (!entries) return [];
    let list = [...entries];

    // Search query filter
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.free_text?.toLowerCase().includes(q));
    }

    // Filter type
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

    return list;
  };

  const filteredEntries = getFilteredEntries();
  const streak = entries ? calculateStreak(entries) : 0;

  // Group entries by month
  const getGroupedEntries = () => {
    const groups: Record<string, JournalEntryModel[]> = {};
    filteredEntries.forEach((entry) => {
      try {
        const dateObj = new Date(entry.entry_date);
        const monthStr = new Intl.DateTimeFormat(locale, {
          month: 'long',
          year: 'numeric',
        }).format(dateObj);
        
        if (!groups[monthStr]) {
          groups[monthStr] = [];
        }
        groups[monthStr].push(entry);
      } catch {
        const monthFallback = entry.entry_date.substring(0, 7);
        if (!groups[monthFallback]) {
          groups[monthFallback] = [];
        }
        groups[monthFallback].push(entry);
      }
    });
    return groups;
  };

  const groupedEntries = getGroupedEntries();

  const getDayAndWeekday = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const dayNum = d.getDate();
      const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
      return { dayNum, weekday };
    } catch {
      return { dayNum: dateStr.split('-')[2] || '?', weekday: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-hf-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-10 w-full bg-hf-bg-secondary animate-pulse rounded-xl mb-4" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-hf-bg-secondary animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-hf-bg-primary shrink-0">
        <h2 className="text-[22px] font-bold tracking-tight text-hf-text-primary">
          {t('journalListTitle')}
        </h2>
        {streak > 0 && (
          <p className="text-[13px] text-hf-accent font-semibold mt-1">
            {t('journalListStreak', { days: streak })}
          </p>
        )}
      </div>

      {/* Search Input */}
      <div className="px-4 pb-2 border-b border-hf-border/10 shrink-0">
        <div className="flex items-center gap-2 bg-hf-bg-secondary border border-hf-border/15 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-hf-text-secondary shrink-0" />
          <input
            type="text"
            placeholder={t('commonSearch')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-[14px] outline-none text-hf-text-primary placeholder:text-hf-text-tertiary"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 shrink-0 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
            filter === 'all' ? 'bg-hf-accent text-white' : 'bg-hf-bg-secondary text-hf-text-primary'
          }`}
        >
          {t('journalListFilterAll')}
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
            filter === 'month' ? 'bg-hf-accent text-white' : 'bg-hf-bg-secondary text-hf-text-primary'
          }`}
        >
          {t('journalListFilterMonth')}
        </button>
        <button
          onClick={() => setFilter('lowMood')}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
            filter === 'lowMood' ? 'bg-hf-accent text-white' : 'bg-hf-bg-secondary text-hf-text-primary'
          }`}
        >
          {t('journalListFilterLowMood')}
        </button>
        <button
          onClick={() => setFilter('highMood')}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
            filter === 'highMood' ? 'bg-hf-accent text-white' : 'bg-hf-bg-secondary text-hf-text-primary'
          }`}
        >
          {t('journalListFilterHighMood')}
        </button>
      </div>

      {/* List content */}
      <div className="flex-1 p-4 flex flex-col gap-6">
        {filteredEntries.length === 0 ? (
          <div className="py-12">
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
          Object.entries(groupedEntries).map(([monthStr, monthEntries]) => (
            <div key={monthStr} className="flex flex-col gap-3">
              <h3 className="text-[14px] font-bold text-hf-text-secondary uppercase tracking-wider ml-1">
                {monthStr}
              </h3>
              <div className="flex flex-col gap-3">
                {monthEntries.map((entry) => {
                  const { dayNum, weekday } = getDayAndWeekday(entry.entry_date);
                  return (
                    <div
                      key={entry.id}
                      onClick={() => navigate(`/journal/${entry.entry_date}`)}
                      className="bg-hf-card border border-hf-border/10 rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:opacity-[0.98] active:scale-[0.99] transition-all"
                    >
                      {/* Date Indicator */}
                      <div className="flex flex-col items-center justify-center bg-hf-bg-secondary border border-hf-border/15 rounded-xl w-12 h-12 shrink-0">
                        <span className="text-[17px] font-bold leading-none">{dayNum}</span>
                        <span className="text-[9px] font-semibold text-hf-text-secondary uppercase mt-0.5">{weekday}</span>
                      </div>

                      {/* Content middle */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-hf-text-primary font-medium line-clamp-2 leading-relaxed">
                          {entry.free_text ? entry.free_text.replace(/###.*?\n/g, '') : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {entry.mood !== undefined && (
                            <span className="text-[11px] font-bold text-hf-accent flex items-center gap-0.5">
                              <span>😊</span>
                              <span>{entry.mood}/10</span>
                            </span>
                          )}
                          {entry.energy !== undefined && (
                            <span className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5">
                              <span>⚡</span>
                              <span>{entry.energy}/10</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => navigate('/journal/new')}
        className="fixed right-5 bottom-20 w-14 h-14 rounded-full bg-hf-accent text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-[0.95] transition-all z-10"
        style={{
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
        }}
      >
        <Plus className="w-6 h-6 stroke-[2px]" />
      </button>
    </div>
  );
}
