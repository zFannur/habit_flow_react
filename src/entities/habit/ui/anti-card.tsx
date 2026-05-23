import { useState } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface AntiHabitCardProps {
  emoji: string;
  name: string;
  days: number;
  initialHeld?: boolean;
  onHeld?: () => void;
  onMore?: () => void;
}

export const AntiHabitCard = ({
  emoji,
  name,
  days,
  initialHeld = false,
  onHeld,
  onMore,
}: AntiHabitCardProps) => {
  const { t } = useTranslation();
  const [prevInitialHeld, setPrevInitialHeld] = useState(initialHeld);
  const [held, setHeld] = useState(initialHeld);

  if (initialHeld !== prevInitialHeld) {
    setPrevInitialHeld(initialHeld);
    setHeld(initialHeld);
  }

  const handleHeld = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    setHeld(true);
    onHeld?.();
  };

  const handleMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    onMore?.();
  };

  return (
    <div
      className="flex items-center gap-3 bg-tg-anti/6 border border-tg-anti/25 rounded-2xl p-4 shadow-sm"
    >
      {/* Left Days Box */}
      <div className="w-16 h-16 rounded-2xl bg-tg-anti/12 flex flex-col items-center justify-center shrink-0">
        <span className="text-[24px] font-bold text-tg-anti leading-none">
          {days}
        </span>
        <span className="text-[9px] font-bold text-tg-anti tracking-wider mt-1 uppercase">
          {t('habitAntiDays')}
        </span>
      </div>

      {/* Middle Text Content */}
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-medium text-tg-anti leading-none block">
          {emoji} без
        </span>
        <h4 className="text-[16px] font-bold text-tg-text leading-tight mt-1 truncate">
          {name}
        </h4>
        
        {held ? (
          <span className="text-[12px] text-tg-anti font-medium mt-1.5 block">
            {t('habitAntiMarkedToday')}
          </span>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleHeld}
              className="bg-tg-anti hover:opacity-90 active:scale-[0.95] text-white font-semibold text-[13px] px-3.5 py-1.5 rounded-full transition-all shrink-0"
            >
              {t('habitAntiHeld')}
            </button>
            
            <button
              type="button"
              onClick={handleMore}
              className="text-[20px] text-tg-hint leading-none hover:bg-tg-secondary-bg active:scale-[0.95] px-2 py-0.5 rounded-lg transition-all"
            >
              ⋯
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
