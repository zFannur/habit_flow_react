import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useHabitsQuery,
  useLogsQuery,
  useHabitLogsQuery,
  useLogHabitMutation,
  useUndoLogMutation,
  combineHabitsWithLogs,
  dateOnly,
  currentStreak,
} from '@/entities/habit';
import { useJournalEntryByDateQuery } from '@/entities/journal';
import { JournalTodayCard } from '@/widgets/journal-today-card';
import {
  BinaryHabitCard,
  CountableHabitCard,
  TimedHabitCard,
  AntiHabitCard,
} from '@/entities/habit';
import { Button, EmptyState } from '@/shared/ui';
import type { HabitWithLog, HabitLogStatus } from '@/entities/habit';

export default function TodayPage() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const todayStr = dateOnly(new Date());

  // Queries
  const { data: habits, isLoading: isLoadingHabits } = useHabitsQuery(userId);
  const { data: todayLogs, isLoading: isLoadingLogs } = useLogsQuery(userId, todayStr, todayStr);
  const { data: todayJournal } = useJournalEntryByDateQuery(userId, todayStr);

  // Mutations
  const logMutation = useLogHabitMutation(userId || '');
  const undoMutation = useUndoLogMutation(userId || '');

  const todayHabits = habits
    ? combineHabitsWithLogs({ habits, logsForDay: todayLogs || [], day: todayStr })
    : [];

  const handleLog = async (habitId: string, status: HabitLogStatus, value?: number) => {
    await logMutation.mutateAsync({
      habitId,
      dateStr: todayStr,
      status,
      value,
    });
  };

  const handleUndo = async (logId: string) => {
    await undoMutation.mutateAsync(logId);
  };

  // Date Formatting
  const getFormattedDate = () => {
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      }).format(new Date());
    } catch {
      return todayStr;
    }
  };

  // Stats Calculations
  const doneCount = todayHabits.filter((h) => h.log?.status === 'done' || h.log?.status === 'partial').length;
  const totalCount = todayHabits.length;

  if (session.status === 'loading' || isLoadingHabits || isLoadingLogs) {
    return (
      <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text p-4 pb-tg-safe-bottom">
        {/* Skeleton Header */}
        <div className="flex justify-between items-center border-b border-tg-hint/10 pb-4">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-32 bg-tg-secondary-bg animate-pulse rounded" />
            <div className="h-4 w-48 bg-tg-secondary-bg animate-pulse rounded" />
          </div>
          <div className="w-10 h-10 rounded-full bg-tg-secondary-bg animate-pulse" />
        </div>
        
        {/* Skeleton List */}
        <div className="flex flex-col gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] bg-tg-secondary-bg animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-tg-secondary-bg border-b border-tg-hint/10 p-4 shrink-0">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-tg-text">
            {getFormattedDate()}
          </h2>
          <p className="text-[12px] text-tg-hint mt-1 flex items-center gap-1">
            {t('todayHeaderStats', {
              done: doneCount,
              total: totalCount,
              streak: 0, // Placeholder, streak will show in cards
            })}
            <span>🔥</span>
          </p>
        </div>
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tg-accent to-purple-600 shadow-md flex items-center justify-center text-white font-extrabold text-[16px] shrink-0 select-none">
          {session.status === 'authenticated'
            ? (session.user.first_name || 'U').charAt(0).toUpperCase()
            : 'U'}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <h3 className="text-lg font-bold text-tg-text mb-1">
          {t('navToday')}
        </h3>

        {totalCount === 0 ? (
          <div className="py-10">
            <EmptyState
              emoji="🌱"
              title={t('emptyTitleNoHabits')}
              description={t('emptyDescNoHabits')}
              action={
                <Button
                  label={t('todayAddHabit')}
                  onClick={() => navigate('/habits/new')}
                />
              }
            />
          </div>
        ) : (
          todayHabits.map((item) => (
            <HabitCardRow
              key={item.habit.id}
              item={item}
              todayStr={todayStr}
              userId={userId || ''}
              onLog={handleLog}
              onUndo={handleUndo}
            />
          ))
        )}

        {/* Add Habit Ghost Button */}
        <button
          type="button"
          onClick={() => navigate('/habits/new')}
          className="w-full py-4 border border-dashed border-tg-hint/25 rounded-2xl flex items-center justify-center gap-2 hover:bg-tg-secondary-bg active:scale-[0.99] transition-all text-tg-hint text-[14px] font-medium"
        >
          <span>➕</span>
          <span>{t('todayAddHabit')}</span>
        </button>

        {/* Journal Today Card */}
        {!todayJournal && (
          <div className="mt-2">
            <JournalTodayCard
              written={false}
              onOpen={() => navigate('/journal/new')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component to fetch and manage individual streak for the cards
interface HabitCardRowProps {
  item: HabitWithLog;
  todayStr: string;
  userId: string;
  onLog: (habitId: string, status: HabitLogStatus, value?: number) => Promise<void>;
  onUndo: (logId: string) => Promise<void>;
}

const HabitCardRow = ({ item, todayStr, userId, onLog, onUndo }: HabitCardRowProps) => {
  const { data: logs } = useHabitLogsQuery(userId, item.habit.id);
  const streak = logs ? currentStreak({ habit: item.habit, logs, today: todayStr }) : 0;

  const isDone = item.log?.status === 'done' || item.log?.status === 'partial';

  const handleToggleBinary = async (done: boolean) => {
    if (done) {
      await onLog(item.habit.id, 'done');
    } else if (item.log?.id) {
      await onUndo(item.log.id);
    }
  };

  const handleLogBinary = async (status: HabitLogStatus) => {
    await onLog(item.habit.id, status);
  };

  const handleProgressCountable = async (value: number) => {
    const target = item.habit.target_value || 1;
    const status = value >= target ? 'done' : 'partial';
    await onLog(item.habit.id, status, value);
  };

  const handleDoneTimed = async (elapsedSeconds: number) => {
    await onLog(item.habit.id, 'done', elapsedSeconds);
  };

  const handleHeldAnti = async () => {
    await onLog(item.habit.id, 'done');
  };

  switch (item.habit.habit_type) {
    case 'binary':
      return (
        <BinaryHabitCard
          emoji={item.habit.icon_emoji || '✅'}
          iconTelegramFileId={item.habit.icon_telegram_file_id}
          name={item.habit.name}
          subtitle={item.habit.reminder_times[0]?.substring(0, 5) || ''}
          streak={streak > 0 ? streak : undefined}
          initialDone={isDone}
          twoMinuteVersion={item.habit.two_minute_version}
          stackAfterEmoji={item.habit.stack_after_habit_id ? '⚓' : undefined} // Stub for stack anchor emoji
          stackAfterName={item.habit.stack_after_habit_id} // ID of anchor habit
          implementationWhen={item.habit.implementation_when}
          implementationWhere={item.habit.implementation_where}
          onToggle={handleToggleBinary}
          onLog={handleLogBinary}
        />
      );

    case 'countable':
      return (
        <CountableHabitCard
          emoji={item.habit.icon_emoji || '🔢'}
          iconTelegramFileId={item.habit.icon_telegram_file_id}
          name={item.habit.name}
          initial={item.log?.value || 0}
          total={item.habit.target_value || 1}
          unit={item.habit.target_unit || ''}
          onProgress={handleProgressCountable}
        />
      );

    case 'timed':
      return (
        <TimedHabitCard
          emoji={item.habit.icon_emoji || '⏱'}
          iconTelegramFileId={item.habit.icon_telegram_file_id}
          name={item.habit.name}
          subtitle={item.habit.reminder_times[0]?.substring(0, 5) || ''}
          streak={streak > 0 ? streak : undefined}
          initialDone={isDone}
          onDone={handleDoneTimed}
        />
      );

    case 'anti':
      return (
        <AntiHabitCard
          emoji={item.habit.icon_emoji || '🛡'}
          name={item.habit.name}
          days={streak}
          initialHeld={isDone}
          onHeld={handleHeldAnti}
          onMore={() => {
            // Stub for anti-habit menu sheet
            alert('Anti-habit details stub');
          }}
        />
      );

    default:
      return null;
  }
};
