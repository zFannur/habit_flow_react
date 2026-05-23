import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useHabitsQuery,
  useHabitLogsQuery,
  useArchiveHabitMutation,
  useDeleteHabitMutation,
  currentStreak,
  dateOnly,
} from '@/entities/habit';
import { EmptyState, BottomSheet } from '@/shared/ui';
import { Search, SlidersHorizontal, ChevronDown, Check, Plus, Archive, Trash2 } from 'lucide-react';
import type { HabitModel, HabitLogStatus } from '@/entities/habit';

type SortOrder = 'byCreated' | 'byStreak' | 'byRate';
type StatusFilter = 'all' | 'active' | 'archived';

export default function HabitsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // Local State
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('byCreated');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Queries & Mutations
  const { data: habits, isLoading } = useHabitsQuery(userId);
  const archiveMutation = useArchiveHabitMutation(userId || '');
  const deleteMutation = useDeleteHabitMutation(userId || '');

  // Extract all categories from habits
  const categories = habits
    ? Array.from(new Set(habits.map((h) => h.category).filter(Boolean))) as string[]
    : [];

  const handleArchive = async (id: string) => {
    if (confirm(t('habitDetailArchivedToast'))) {
      await archiveMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('habitDetailDeleteConfirmBody'))) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Filter and Sort Logic
  const getFilteredHabits = () => {
    if (!habits) return [];

    let list = [...habits];

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter((h) => !h.is_archived);
    } else if (statusFilter === 'archived') {
      list = list.filter((h) => h.is_archived);
    }

    // Category filter
    if (categoryFilter) {
      list = list.filter((h) => h.category === categoryFilter);
    }

    // Search query
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q));
    }

    // Sort order (Streaks are fetched in the child cards, we sort by creation date or position)
    if (sortOrder === 'byCreated') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      list.sort((a, b) => a.position - b.position);
    }

    return list;
  };

  const filteredHabits = getFilteredHabits();

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-tg-secondary-bg animate-pulse rounded mb-4" />
        <div className="h-10 w-full bg-tg-secondary-bg animate-pulse rounded-xl mb-4" />
        <div className="flex gap-2 mb-6">
          <div className="h-8 w-16 bg-tg-secondary-bg animate-pulse rounded-full" />
          <div className="h-8 w-20 bg-tg-secondary-bg animate-pulse rounded-full" />
          <div className="h-8 w-24 bg-tg-secondary-bg animate-pulse rounded-full" />
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-tg-secondary-bg animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-tg-bg p-4 shrink-0">
        <h2 className="text-[22px] font-bold tracking-tight text-tg-text">
          {t('habitsListTitle')}
        </h2>
        <button
          type="button"
          onClick={() => setIsSortOpen(true)}
          className="w-9 h-9 rounded-xl bg-tg-secondary-bg flex items-center justify-center text-tg-text hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <SlidersHorizontal className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Search Field */}
      <div className="px-4 pb-2 border-b border-tg-hint/10 shrink-0">
        <div className="flex items-center gap-2 bg-tg-secondary-bg border border-tg-hint/15 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-tg-hint shrink-0" />
          <input
            type="text"
            placeholder={t('habitsListSearchHint')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-[14px] outline-none text-tg-text placeholder-tg-hint"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 shrink-0 scrollbar-none">
        <button
          onClick={() => { setStatusFilter('all'); setCategoryFilter(null); }}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
            statusFilter === 'all' && !categoryFilter
              ? 'bg-tg-accent text-white'
              : 'bg-tg-secondary-bg text-tg-text'
          }`}
        >
          {t('habitsListFilterAll')}
        </button>
        <button
          onClick={() => { setStatusFilter('active'); setCategoryFilter(null); }}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
            statusFilter === 'active' && !categoryFilter
              ? 'bg-tg-accent text-white'
              : 'bg-tg-secondary-bg text-tg-text'
          }`}
        >
          {t('habitsListFilterActive')}
        </button>
        <button
          onClick={() => { setStatusFilter('archived'); setCategoryFilter(null); }}
          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
            statusFilter === 'archived' && !categoryFilter
              ? 'bg-tg-accent text-white'
              : 'bg-tg-secondary-bg text-tg-text'
          }`}
        >
          {t('habitsListFilterArchive')}
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(categoryFilter === cat ? null : cat); setStatusFilter('all'); }}
            className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 ${
              categoryFilter === cat
                ? 'bg-tg-accent text-white'
                : 'bg-tg-secondary-bg text-tg-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sorting bar & count */}
      <div className="flex justify-between items-center px-4 py-1 shrink-0">
        <span className="text-[12px] text-tg-hint">
          {t('habitsListCount', { count: filteredHabits.length })}
        </span>
        <button
          type="button"
          onClick={() => setIsSortOpen(true)}
          className="flex items-center gap-1 text-[13px] font-semibold text-tg-accent"
        >
          <span>
            {t('habitsListSortLabel')}:{' '}
            {sortOrder === 'byCreated'
              ? t('habitsListSortByCreated')
              : sortOrder === 'byStreak'
              ? t('habitsListSortByStreak')
              : t('habitsListSortByProgress')}
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {filteredHabits.length === 0 ? (
          <div className="py-12">
            <EmptyState emoji="🔍" title={t('habitsListEmpty')} />
          </div>
        ) : (
          filteredHabits.map((h) => (
            <HabitsListCardRow
              key={h.id}
              habit={h}
              userId={userId || ''}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onTap={() => navigate(`/habits/${h.id}`)}
            />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => navigate('/habits/new')}
        className="fixed right-5 bottom-20 w-14 h-14 rounded-full bg-tg-accent text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-[0.95] transition-all z-10"
        style={{
          boxShadow: '0 6px 20px rgba(var(--tg-theme-accent-text-color, 36, 129, 204), 0.45)',
        }}
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Sort Options Bottom Sheet */}
      <BottomSheet
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        title={t('habitsListSortLabel')}
      >
        <button
          type="button"
          onClick={() => { setSortOrder('byCreated'); setIsSortOpen(false); }}
          className="w-full flex justify-between items-center bg-tg-secondary-bg hover:opacity-95 p-3.5 rounded-xl text-left"
        >
          <span className={`text-[14px] font-medium ${sortOrder === 'byCreated' ? 'text-tg-accent' : 'text-tg-text'}`}>
            {t('habitsListSortByCreated')}
          </span>
          {sortOrder === 'byCreated' && <Check className="w-4 h-4 text-tg-accent" />}
        </button>

        <button
          type="button"
          onClick={() => { setSortOrder('byStreak'); setIsSortOpen(false); }}
          className="w-full flex justify-between items-center bg-tg-secondary-bg hover:opacity-95 p-3.5 rounded-xl text-left mt-2"
        >
          <span className={`text-[14px] font-medium ${sortOrder === 'byStreak' ? 'text-tg-accent' : 'text-tg-text'}`}>
            {t('habitsListSortByStreak')}
          </span>
          {sortOrder === 'byStreak' && <Check className="w-4 h-4 text-tg-accent" />}
        </button>

        <button
          type="button"
          onClick={() => { setSortOrder('byRate'); setIsSortOpen(false); }}
          className="w-full flex justify-between items-center bg-tg-secondary-bg hover:opacity-95 p-3.5 rounded-xl text-left mt-2"
        >
          <span className={`text-[14px] font-medium ${sortOrder === 'byRate' ? 'text-tg-accent' : 'text-tg-text'}`}>
            {t('habitsListSortByProgress')}
          </span>
          {sortOrder === 'byRate' && <Check className="w-4 h-4 text-tg-accent" />}
        </button>
      </BottomSheet>
    </div>
  );
}

// Subcomponent to fetch and render specific habit item card
interface HabitsListCardRowProps {
  habit: HabitModel;
  userId: string;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onTap: () => void;
}

const HabitsListCardRow = ({ habit, userId, onArchive, onDelete, onTap }: HabitsListCardRowProps) => {
  const { t } = useTranslation();
  const { data: logs } = useHabitLogsQuery(userId, habit.id);

  const today = new Date();
  const todayStr = dateOnly(today);
  const streak = logs ? currentStreak({ habit, logs, today: todayStr }) : 0;

  // Align Monday of current week
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(new Date(today).setDate(diff));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const logsByDate = logs
    ? logs.reduce((acc, log) => {
        acc[log.log_date] = log.status;
        return acc;
      }, {} as Record<string, HabitLogStatus>)
    : {};

  const dayLabels = [
    t('habitWeekMon'),
    t('habitWeekTue'),
    t('habitWeekWed'),
    t('habitWeekThu'),
    t('habitWeekFri'),
    t('habitWeekSat'),
    t('habitWeekSun'),
  ];

  const isPaused = habit.end_date && habit.end_date < todayStr;
  const isAnti = habit.habit_type === 'anti';

  const typeBadgeLabel = () => {
    switch (habit.habit_type) {
      case 'binary': return t('habitTypeBinary');
      case 'countable': return t('habitTypeCountable');
      case 'timed': return t('habitTypeTimed');
      case 'anti': return t('habitTypeAnti');
      default: return '';
    }
  };

  const getHeatCellBg = (day: Date) => {
    const dStr = dateOnly(day);
    if (dStr > todayStr) return 'bg-tg-secondary-bg opacity-30';

    const status = logsByDate[dStr];
    switch (status) {
      case 'done':
      case 'partial':
        return 'bg-tg-success';
      case 'missed':
        return 'bg-tg-danger';
      case 'skipped':
        return 'bg-tg-secondary-bg border border-tg-hint/15';
      default:
        return 'bg-tg-secondary-bg';
    }
  };

  return (
    <div
      onClick={onTap}
      className={`relative bg-tg-section border rounded-2xl p-4 shadow-sm flex gap-3.5 items-start cursor-pointer hover:opacity-[0.98] transition-all select-none ${
        habit.is_archived ? 'opacity-50 grayscale' : 'opacity-100'
      }`}
      style={{
        borderColor: isAnti ? 'rgba(16, 185, 129, 0.2)' : 'var(--tg-theme-border-color, rgba(0,0,0,0.08))',
      }}
    >
      {/* Icon Circle */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[20px] ${
          isAnti ? 'bg-tg-anti/12 border border-tg-anti/25' : 'bg-tg-accent/8 text-tg-accent'
        }`}
      >
        {habit.icon_emoji || '✅'}
      </div>

      {/* Details Middle */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[16px] font-semibold leading-snug truncate ${isPaused ? 'text-tg-hint' : 'text-tg-text'}`}>
          {habit.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[12px] text-tg-hint">
            {habit.schedule_type === 'daily' ? 'Every day' : habit.schedule_type}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isAnti ? 'bg-tg-anti/12 text-tg-anti' : 'bg-tg-accent/12 text-tg-accent'
          }`}>
            {typeBadgeLabel()}
          </span>
        </div>

        {/* 7 Day Heatmap */}
        <div className="flex gap-1.5 mt-3.5 overflow-x-auto scrollbar-none">
          {weekDays.map((day, idx) => {
            const isCurrentDay = dateOnly(day) === todayStr;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-5 h-5 rounded-[5px] transition-all ${getHeatCellBg(day)} ${
                    isCurrentDay ? 'ring-1.5 ring-tg-accent/60' : ''
                  }`}
                />
                <span className={`text-[8px] font-medium leading-none ${isCurrentDay ? 'text-tg-accent font-bold' : 'text-tg-hint'}`}>
                  {dayLabels[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Badge & Actions */}
      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[13px] font-bold ${
          isAnti ? 'bg-tg-anti/12 text-tg-anti' : 'bg-tg-warning/10 text-tg-warning'
        }`}>
          <span>{isAnti ? '🛡️' : '🔥'}</span>
          <span>{streak}</span>
        </div>

        {/* Quick Actions (Archive/Delete) */}
        <div className="flex items-center gap-1.5">
          {!habit.is_archived ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onArchive(habit.id); }}
              className="p-1.5 rounded-lg hover:bg-tg-secondary-bg text-tg-hint hover:text-tg-warning transition-all"
            >
              <Archive className="w-4 h-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
            className="p-1.5 rounded-lg hover:bg-tg-secondary-bg text-tg-hint hover:text-tg-destructive transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
