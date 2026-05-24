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
      className="flex items-center gap-3 border rounded-hf-lg p-4 shadow-hf-card"
      style={{
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
      }}
    >
      {/* Left Days Box */}
      <div className="w-16 h-16 rounded-hf-lg flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
        <span className="text-hf-headline-lg text-hf-anti leading-none">
          {days}
        </span>
        <span className="text-[9px] font-bold text-hf-anti tracking-wider mt-[1px] uppercase">
          {t('habitAntiDays')}
        </span>
      </div>

      {/* Middle Text Content */}
      <div className="flex-1 min-w-0">
        <span className="text-hf-label-md text-hf-anti block">
          {emoji} {t('habitAntiWithout')}
        </span>
        <h4 className="text-hf-body-lg font-bold text-hf-text-primary mt-0.5 truncate">
          {name}
        </h4>
        
        {held ? (
          <span className="text-hf-label-md text-hf-anti mt-1.5 block">
            {t('habitAntiMarkedToday')}
          </span>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleHeld}
              className="bg-hf-anti hover:opacity-90 active:scale-[0.95] text-white font-semibold text-hf-label-md px-[14px] py-[6px] rounded-hf-full transition-all shrink-0"
            >
              {t('habitAntiHeld')}
            </button>
            
            <button
              type="button"
              onClick={handleMore}
              className="text-[20px] text-hf-text-secondary leading-none hover:bg-hf-bg-secondary active:scale-[0.95] px-2 py-0.5 rounded-lg transition-all"
            >
              ⋯
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
