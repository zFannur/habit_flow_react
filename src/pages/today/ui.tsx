import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useHabitsQuery,
  useLogsQuery,
  useLogHabitMutation,
  combineHabitsWithLogs,
  currentStreak,
  dateOnly,
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
import type { HabitWithLog, HabitLogStatus, HabitLogModel, HabitModel } from '@/entities/habit';

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dateOnly(d);
}

function computeMaxStreak(logs: HabitLogModel[], habits: HabitModel[], today: string): number {
  let max = 0;
  for (const habit of habits) {
    const habitLogs = logs.filter((l) => l.habit_id === habit.id);
    const s = currentStreak({ habit, logs: habitLogs, today });
    if (s > max) max = s;
  }
  return max;
}

export default function TodayPage() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const todayStr = dateOnly(new Date());
  const ninetyDaysAgo = getDateDaysAgo(90);

  const { data: habits, isLoading: isLoadingHabits } = useHabitsQuery(userId);
  const { data: todayLogs, isLoading: isLoadingLogs } = useLogsQuery(userId, todayStr, todayStr);
  const { data: allLogs } = useLogsQuery(userId, ninetyDaysAgo, todayStr);
  const { data: todayJournal } = useJournalEntryByDateQuery(userId, todayStr);

  const logMutation = useLogHabitMutation(userId || '');

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

  const doneCount = todayHabits.filter((h) => h.log?.status === 'done' || h.log?.status === 'partial').length;
  const totalCount = todayHabits.length;
  const maxStreak = habits?.length && allLogs?.length
    ? computeMaxStreak(allLogs, habits, todayStr)
    : 0;

  if (session.status === 'loading' || isLoadingHabits || isLoadingLogs) {
    return (
      <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary p-4 pb-tg-safe-bottom">
        <div className="flex justify-between items-center border-b border-hf-border pb-4">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-32 bg-hf-bg-secondary animate-pulse rounded" />
            <div className="h-4 w-48 bg-hf-bg-secondary animate-pulse rounded" />
          </div>
          <div className="w-10 h-10 rounded-full bg-hf-bg-secondary animate-pulse" />
        </div>
        <div className="flex flex-col gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] bg-hf-bg-secondary animate-pulse rounded-hf-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      <div className="flex justify-between items-center bg-hf-bg-secondary border-b border-hf-border p-4 shrink-0">
        <div>
          <h2 className="text-hf-headline-md text-hf-text-primary tracking-[-0.02em]">
            {getFormattedDate()}
          </h2>
          <p className="text-hf-body-sm text-hf-text-secondary mt-1">
            {t('todayHeaderStats', {
              done: doneCount,
              total: totalCount,
              streak: maxStreak,
            })}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hf-accent to-[#7C3AED] shadow-md flex items-center justify-center text-white font-extrabold text-[16px] shrink-0 select-none">
          {session.status === 'authenticated'
            ? (session.user.first_name || 'U').charAt(0).toUpperCase()
            : 'U'}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3">
        <h3 className="text-hf-headline-sm text-hf-text-primary mb-1">
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
              allLogs={allLogs || []}
              onLog={handleLog}
            />
          ))
        )}

        <button
          type="button"
          onClick={() => navigate('/habits/new')}
          className="w-full py-4 border border-dashed border-hf-border/25 rounded-hf-lg flex items-center justify-center gap-2 hover:bg-hf-bg-secondary active:scale-[0.99] transition-all text-hf-text-secondary text-hf-body-md"
        >
          <span>➕</span>
          <span>{t('todayAddHabit')}</span>
        </button>

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

interface HabitCardRowProps {
  item: HabitWithLog;
  todayStr: string;
  allLogs: HabitLogModel[];
  onLog: (habitId: string, status: HabitLogStatus, value?: number) => Promise<void>;
}

const HabitCardRow = ({ item, todayStr, allLogs, onLog }: HabitCardRowProps) => {
  const streak = allLogs.length
    ? currentStreak({ habit: item.habit, logs: allLogs, today: todayStr })
    : 0;

  const isDone = item.log?.status === 'done' || item.log?.status === 'partial';

  const handleToggleBinary = async (done: boolean) => {
    if (done) {
      await onLog(item.habit.id, 'done');
    } else {
      await onLog(item.habit.id, 'missed');
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
          stackAfterEmoji={item.habit.stack_after_habit_id ? '⚓' : undefined}
          stackAfterName={item.habit.stack_after_habit_id}
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
            alert('Anti-habit details stub');
          }}
        />
      );

    default:
      return null;
  }
};
