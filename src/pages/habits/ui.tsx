import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useHabitsQuery,
  useLogsQuery,
  useArchiveHabitMutation,
  useDeleteHabitMutation,
  currentStreak,
  dateOnly,
} from '@/entities/habit';
import { EmptyState, BottomSheet } from '@/shared/ui';
import { Search, SlidersHorizontal, Check, Plus, Archive, Trash2 } from 'lucide-react';
import type { HabitModel, HabitLogModel, HabitLogStatus } from '@/entities/habit';

type SortOrder = 'byCreated' | 'byStreak' | 'byRate';

export default function HabitsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('byCreated');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const { data: habits, isLoading } = useHabitsQuery(userId);
  const { data: allLogs } = useLogsQuery(userId, '2020-01-01', dateOnly(new Date()));
  const archiveMutation = useArchiveHabitMutation(userId || '');
  const deleteMutation = useDeleteHabitMutation(userId || '');

  const todayStr = dateOnly(new Date());

  const categories = habits
    ? Array.from(new Set(habits.map((h) => h.category).filter(Boolean))) as string[]
    : [];

  const computeStreak = (habit: HabitModel, logs: HabitLogModel[]): number => {
    return currentStreak({ habit, logs: logs.filter(l => l.habit_id === habit.id), today: todayStr });
  };

  const computeRate = (habit: HabitModel, logs: HabitLogModel[]): number => {
    const habitLogs = logs.filter((l) => l.habit_id === habit.id);
    if (habitLogs.length === 0) return 0;
    const done = habitLogs.filter((l) => l.status === 'done' || l.status === 'partial').length;
    return done / habitLogs.length;
  };

  const handleArchive = async (id: string) => {
    if (confirm(t('habitsListArchiveConfirm'))) {
      await archiveMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('habitsListDeleteConfirm'))) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getFilteredHabits = () => {
    if (!habits) return [];

    let list = [...habits];
    const logs = allLogs || [];

    if (statusFilter === 'active') {
      list = list.filter((h) => !h.is_archived);
    } else if (statusFilter === 'archived') {
      list = list.filter((h) => h.is_archived);
    }

    if (categoryFilter) {
      list = list.filter((h) => h.category === categoryFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q));
    }

    if (sortOrder === 'byCreated') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === 'byStreak') {
      list.sort((a, b) => computeStreak(b, logs) - computeStreak(a, logs));
    } else if (sortOrder === 'byRate') {
      list.sort((a, b) => computeRate(b, logs) - computeRate(a, logs));
    }

    return list;
  };

  const filteredHabits = getFilteredHabits();

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="h-6 w-32 bg-hf-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-10 w-full bg-hf-bg-secondary animate-pulse rounded-hf-md mb-4" />
        <div className="flex gap-2 mb-6">
          <div className="h-8 w-16 bg-hf-bg-secondary animate-pulse rounded-hf-full" />
          <div className="h-8 w-20 bg-hf-bg-secondary animate-pulse rounded-hf-full" />
          <div className="h-8 w-24 bg-hf-bg-secondary animate-pulse rounded-hf-full" />
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-hf-bg-secondary animate-pulse rounded-hf-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      <div className="flex justify-between items-center bg-hf-bg-primary p-4 shrink-0">
        <h2 className="text-hf-headline-md text-hf-text-primary tracking-[-0.02em]">
          {t('habitsListTitle')}
        </h2>
        <button
          type="button"
          onClick={() => setIsSortOpen(true)}
          className="w-9 h-9 rounded-hf-md bg-hf-bg-secondary flex items-center justify-center text-hf-text-primary hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <SlidersHorizontal className="w-[18px] h-[18px]" />
        </button>
      </div>

      <div className="px-4 pb-2 border-b border-hf-border shrink-0">
        <div className="flex items-center gap-2 bg-hf-bg-secondary border border-hf-border rounded-hf-md px-3 py-2">
          <Search className="w-4 h-4 text-hf-text-secondary shrink-0" />
          <input
            type="text"
            placeholder={t('habitsListSearchHint')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-hf-body-md outline-none text-hf-text-primary placeholder:text-hf-text-tertiary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 shrink-0 scrollbar-none">
        <button
          onClick={() => { setStatusFilter('all'); setCategoryFilter(null); }}
          className={`px-3 py-1.5 rounded-hf-full text-hf-body-sm font-semibold transition-all shrink-0 ${
            statusFilter === 'all' && !categoryFilter
              ? 'bg-hf-accent text-white'
              : 'bg-hf-bg-secondary text-hf-text-primary'
          }`}
        >
          {t('habitsListFilterAll')}
        </button>
        <button
          onClick={() => { setStatusFilter('active'); setCategoryFilter(null); }}
          className={`px-3 py-1.5 rounded-hf-full text-hf-body-sm font-semibold transition-all shrink-0 ${
            statusFilter === 'active' && !categoryFilter
              ? 'bg-hf-accent text-white'
              : 'bg-hf-bg-secondary text-hf-text-primary'
          }`}
        >
          {t('habitsListFilterActive')}
        </button>
        <button
          onClick={() => { setStatusFilter('archived'); setCategoryFilter(null); }}
          className={`px-3 py-1.5 rounded-hf-full text-hf-body-sm font-semibold transition-all shrink-0 ${
            statusFilter === 'archived' && !categoryFilter
              ? 'bg-hf-accent text-white'
              : 'bg-hf-bg-secondary text-hf-text-primary'
          }`}
        >
          {t('habitsListFilterArchive')}
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(categoryFilter === cat ? null : cat); setStatusFilter('all'); }}
            className={`px-3 py-1.5 rounded-hf-full text-hf-body-sm font-semibold transition-all shrink-0 ${
              categoryFilter === cat
                ? 'bg-hf-accent text-white'
                : 'bg-hf-bg-secondary text-hf-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

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
              allLogs={allLogs || []}
              todayStr={todayStr}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onTap={() => navigate(`/habits/${h.id}`)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/habits/new')}
        className="fixed right-5 bottom-20 w-14 h-14 rounded-full bg-hf-accent text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-[0.95] transition-all z-10"
        style={{
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomSheet
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        title={t('habitsListSortLabel')}
      >
        {(['byCreated', 'byStreak', 'byRate'] as SortOrder[]).map((order) => (
          <button
            key={order}
            type="button"
            onClick={() => { setSortOrder(order); setIsSortOpen(false); }}
            className="w-full flex justify-between items-center bg-hf-bg-secondary hover:opacity-95 p-3.5 rounded-hf-md text-left mt-2 first:mt-0"
          >
            <span className={`text-hf-body-md ${sortOrder === order ? 'text-hf-accent font-semibold' : 'text-hf-text-primary'}`}>
              {order === 'byCreated'
                ? t('habitsListSortByCreated')
                : order === 'byStreak'
                ? t('habitsListSortByStreak')
                : t('habitsListSortByProgress')}
            </span>
            {sortOrder === order && <Check className="w-4 h-4 text-hf-accent" />}
          </button>
        ))}
      </BottomSheet>
    </div>
  );
}

interface HabitsListCardRowProps {
  habit: HabitModel;
  allLogs: HabitLogModel[];
  todayStr: string;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onTap: () => void;
}

const HabitsListCardRow = ({ habit, allLogs, todayStr, onArchive, onDelete, onTap }: HabitsListCardRowProps) => {
  const { t } = useTranslation();

  const streak = allLogs.length
    ? currentStreak({ habit, logs: allLogs, today: todayStr })
    : 0;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(new Date(today).setDate(diff));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const habitLogs = allLogs.filter((l) => l.habit_id === habit.id);
  const logsByDate = habitLogs.reduce((acc, log) => {
    acc[log.log_date] = log.status;
    return acc;
  }, {} as Record<string, HabitLogStatus>);

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
    if (dStr > todayStr) return 'bg-hf-bg-secondary opacity-30';

    const status = logsByDate[dStr];
    switch (status) {
      case 'done':
      case 'partial':
        return 'bg-hf-success';
      case 'missed':
        return 'bg-hf-danger';
      case 'skipped':
        return 'bg-hf-bg-secondary border border-hf-border';
      default:
        return 'bg-hf-bg-secondary';
    }
  };

  return (
    <div
      onClick={onTap}
      className={`relative bg-hf-card border rounded-hf-lg p-4 shadow-hf-card flex gap-3.5 items-start cursor-pointer hover:opacity-[0.98] transition-all select-none ${
        habit.is_archived ? 'opacity-50 grayscale' : 'opacity-100'
      }`}
      style={{
        borderColor: isAnti ? 'rgba(16, 185, 129, 0.2)' : 'var(--hf-border)',
      }}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[20px] ${
          isAnti ? 'bg-hf-anti/12 border border-hf-anti/25' : 'bg-hf-accent/8 text-hf-accent'
        }`}
      >
        {habit.icon_emoji || '✅'}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`text-hf-title-md truncate ${isPaused ? 'text-hf-text-secondary' : 'text-hf-text-primary'}`}>
          {habit.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-hf-body-sm text-hf-text-secondary">
            {(() => {
              const map: Record<string, string> = {
                daily: 'habitRepeatDaily',
                weekdays: 'habitRepeatWeekdays',
                n_per_week: 'habitRepeatNPerWeek',
                every_n: 'habitRepeatEveryN',
                monthly: 'habitRepeatMonthly',
              };
              const key = map[habit.schedule_type];
              return key ? t(key as Parameters<typeof t>[0]) : habit.schedule_type;
            })()}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-hf-full ${
            isAnti ? 'bg-hf-anti/12 text-hf-anti' : 'bg-hf-accent/12 text-hf-accent'
          }`}>
            {typeBadgeLabel()}
          </span>
        </div>

        <div className="flex gap-1.5 mt-3.5 overflow-x-auto scrollbar-none">
          {weekDays.map((day, idx) => {
            const isCurrentDay = dateOnly(day) === todayStr;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-5 h-5 rounded-[5px] transition-all ${getHeatCellBg(day)} ${
                    isCurrentDay ? 'ring-1.5 ring-hf-accent/60' : ''
                  }`}
                />
                <span className={`text-[8px] font-medium leading-none ${isCurrentDay ? 'text-hf-accent font-bold' : 'text-hf-text-secondary'}`}>
                  {dayLabels[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 shrink-0">
        <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-hf-body-sm font-bold ${
          isAnti ? 'bg-hf-anti/12 text-hf-anti' : 'bg-hf-warning/10 text-hf-warning'
        }`}>
          <span>{isAnti ? '🛡️' : '🔥'}</span>
          <span>{streak}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!habit.is_archived ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onArchive(habit.id); }}
              className="p-1.5 rounded-lg hover:bg-hf-bg-secondary text-hf-text-secondary hover:text-hf-warning transition-all"
            >
              <Archive className="w-4 h-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
            className="p-1.5 rounded-lg hover:bg-hf-bg-secondary text-hf-text-secondary hover:text-hf-danger transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
