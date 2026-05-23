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
        className={`flex items-center gap-3 bg-hf-card border border-hf-border rounded-hf-lg p-4 shadow-hf-card transition-opacity duration-200 ${
          done ? 'opacity-[0.62]' : 'opacity-100'
        }`}
      >
        <EmojiIcon
          emoji={emoji}
          iconTelegramFileId={iconTelegramFileId}
          className={done ? 'bg-hf-accent/8' : undefined}
        />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-hf-title-md text-hf-text-primary truncate">
            {name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-hf-body-sm text-hf-text-tertiary" style={{ fontSize: '12px' }}>
              {subtitle}
            </span>
            {streak !== undefined && streak > 0 && (
              <StreakBadge days={streak} />
            )}
          </div>
          {behaviourLine && (
            <p className="text-hf-label-sm text-hf-text-tertiary italic mt-1 truncate">
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
          className="w-full text-left bg-hf-bg-secondary hover:opacity-90 active:scale-[0.99] transition-all p-4 rounded-xl flex flex-col"
        >
          <span className="text-[14px] font-semibold text-hf-text-primary">
            {t('habitCardLogSheetFull')}
          </span>
          <span className="text-[12px] text-hf-text-secondary mt-1">
            {t('habitCardLogSheetFullSub')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectOption('partial')}
          className="w-full text-left bg-hf-bg-secondary hover:opacity-90 active:scale-[0.99] transition-all p-4 rounded-xl flex flex-col mt-2"
        >
          <span className="text-[14px] font-semibold text-hf-text-primary">
            {t('habitCardLogSheetMin')}
          </span>
          <span className="text-[12px] text-hf-text-secondary mt-1">
            {t('habitCardLogSheetMinSub', { version: twoMinuteVersion || '' })}
          </span>
        </button>
      </BottomSheet>
    </>
  );
};
