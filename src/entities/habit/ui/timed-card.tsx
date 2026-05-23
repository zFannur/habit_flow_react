import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/shared/lib/i18n';
import { hapticFeedback } from '@telegram-apps/sdk-react';
import { EmojiIcon } from './emoji-icon';
import { StreakBadge } from './streak-badge';

interface TimedHabitCardProps {
  emoji: string;
  iconTelegramFileId?: string;
  name: string;
  subtitle: string;
  streak?: number;
  initialDone?: boolean;
  onDone?: (elapsedSeconds: number) => void;
}

export const TimedHabitCard = ({
  emoji,
  iconTelegramFileId,
  name,
  subtitle,
  streak,
  initialDone = false,
  onDone,
}: TimedHabitCardProps) => {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }

    if (running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRunning(false);
      onDone?.(elapsed);
    } else {
      setRunning(true);
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-3 bg-hf-card border border-hf-border rounded-hf-lg p-4 shadow-hf-card transition-opacity duration-200 ${
        initialDone ? 'opacity-[0.62]' : 'opacity-100'
      }`}
    >
      <EmojiIcon
        emoji={emoji}
        iconTelegramFileId={iconTelegramFileId}
        className="bg-hf-warning/10"
      />

      <div className="flex-1 min-w-0">
        <h4 className="text-hf-title-md text-hf-text-primary truncate">
          {name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          {running ? (
            <span className="text-hf-label-md text-hf-accent font-mono">
              {formatTime(elapsed)}
            </span>
          ) : (
            <span className="text-hf-body-sm text-hf-text-tertiary" style={{ fontSize: '12px' }}>
              {subtitle}
            </span>
          )}
          {streak !== undefined && streak > 0 && (
            <StreakBadge days={streak} />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleTimer}
        className="px-[14px] py-[7px] rounded-hf-full border-[1.5px] border-hf-accent text-hf-title-sm text-hf-accent hover:bg-hf-accent/5 active:scale-[0.95] transition-all shrink-0"
      >
        {running ? t('habitTimerPause') : t('habitTimerStart')}
      </button>
    </div>
  );
};
