import { useState } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { BottomSheet } from '@/shared/ui';
import { CircleCheck } from './circle-check';
import { EmojiIcon } from './emoji-icon';
import { StreakBadge } from './streak-badge';
import type { HabitLogStatus } from '../model/types';

interface BinaryHabitCardProps {
  emoji: string;
  iconTelegramFileId?: string;
  name: string;
  subtitle: string;
  streak?: number;
  initialDone?: boolean;
  onToggle?: (done: boolean) => void;
  onLog?: (status: HabitLogStatus) => void;
  stackAfterEmoji?: string;
  stackAfterName?: string;
  implementationWhen?: string;
  implementationWhere?: string;
  twoMinuteVersion?: string;
}

export const BinaryHabitCard = ({
  emoji,
  iconTelegramFileId,
  name,
  subtitle,
  streak,
  initialDone = false,
  onToggle,
  onLog,
  stackAfterEmoji,
  stackAfterName,
  implementationWhen,
  implementationWhere,
  twoMinuteVersion,
}: BinaryHabitCardProps) => {
  const { t } = useTranslation();
  const [prevInitialDone, setPrevInitialDone] = useState(initialDone);
  const [done, setDone] = useState(initialDone);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (initialDone !== prevInitialDone) {
    setPrevInitialDone(initialDone);
    setDone(initialDone);
  }

  const getBehaviourLine = () => {
    if (stackAfterName?.trim()) {
      return t('habitCardStackAfter', {
        emoji: stackAfterEmoji || '',
        name: stackAfterName,
      });
    }
    const when = implementationWhen?.trim() || '';
    const where = implementationWhere?.trim() || '';
    if (when && where) {
      return `${when} ${where}`;
    }
    return null;
  };

  const handleTap = () => {
    const next = !done;
    if (!next) {
      setDone(false);
      onToggle?.(false);
      return;
    }

    const twoMin = twoMinuteVersion?.trim() || '';
    if (!twoMin) {
      setDone(true);
      onToggle?.(true);
      return;
    }

    setIsSheetOpen(true);
  };

  const handleSelectOption = (status: 'done' | 'partial') => {
    setDone(true);
    setIsSheetOpen(false);
    if (onLog) {
      onLog(status);
    } else {
      onToggle?.(true);
    }
  };

  const behaviourLine = getBehaviourLine();

  return (
    <>
      <div
        className={`flex items-center gap-3 bg-tg-section border border-tg-hint/10 rounded-2xl p-4 shadow-sm transition-opacity duration-200 ${
          done ? 'opacity-[0.62]' : 'opacity-100'
        }`}
      >
        <EmojiIcon
          emoji={emoji}
          iconTelegramFileId={iconTelegramFileId}
          className={done ? 'bg-tg-accent/8' : undefined}
        />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-[16px] font-semibold text-tg-text leading-tight truncate">
            {name}
          </h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[12px] text-tg-hint leading-none">
              {subtitle}
            </span>
            {streak !== undefined && streak > 0 && (
              <StreakBadge days={streak} />
            )}
          </div>
          {behaviourLine && (
            <p className="text-[11px] text-tg-hint italic leading-tight mt-1 truncate">
              {behaviourLine}
            </p>
          )}
        </div>

        <CircleCheck done={done} onTap={handleTap} />
      </div>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={t('habitCardLogSheetTitle')}
      >
        <button
          type="button"
          onClick={() => handleSelectOption('done')}
          className="w-full text-left bg-tg-secondary-bg hover:opacity-90 active:scale-[0.99] transition-all p-4 rounded-xl flex flex-col"
        >
          <span className="text-[14px] font-semibold text-tg-text">
            {t('habitCardLogSheetFull')}
          </span>
          <span className="text-[12px] text-tg-hint mt-1">
            {t('habitCardLogSheetFullSub')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectOption('partial')}
          className="w-full text-left bg-tg-secondary-bg hover:opacity-90 active:scale-[0.99] transition-all p-4 rounded-xl flex flex-col mt-2"
        >
          <span className="text-[14px] font-semibold text-tg-text">
            {t('habitCardLogSheetMin')}
          </span>
          <span className="text-[12px] text-tg-hint mt-1">
            {t('habitCardLogSheetMinSub', { version: twoMinuteVersion || '' })}
          </span>
        </button>
      </BottomSheet>
    </>
  );
};
