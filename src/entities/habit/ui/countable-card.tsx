import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { hapticFeedback } from '@telegram-apps/sdk-react';
import { EmojiIcon } from './emoji-icon';

interface CountableHabitCardProps {
  emoji: string;
  iconTelegramFileId?: string;
  name: string;
  initial: number;
  total: number;
  unit: string;
  onProgress?: (value: number) => void;
}

export const CountableHabitCard = ({
  emoji,
  iconTelegramFileId,
  name,
  initial,
  total,
  unit,
  onProgress,
}: CountableHabitCardProps) => {
  const [prevInitial, setPrevInitial] = useState(initial);
  const [current, setCurrent] = useState(initial);
  const debounceRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setCurrent(initial);
  }

  // Flush any pending debounced call and clear timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
        if (pendingValueRef.current !== null) {
          onProgress?.(pendingValueRef.current);
          pendingValueRef.current = null;
        }
      }
    };
    // onProgress intentionally excluded — we only want the cleanup to run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = current >= total;
  const pct = Math.min(Math.max(current / total, 0), 1) * 100;

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hapticFeedback.impactOccurred.isAvailable()) {
      hapticFeedback.impactOccurred('light');
    }
    const next = Math.min(current + 1, total + 2); // Allow over-completion by up to 2
    setCurrent(next);
    pendingValueRef.current = next;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      pendingValueRef.current = null;
      onProgress?.(next);
    }, 400);
  };

  return (
    <div
      className={`flex flex-col bg-hf-card border border-hf-border rounded-hf-lg p-4 shadow-hf-card transition-opacity duration-200 ${
        done ? 'opacity-[0.62]' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <EmojiIcon
          emoji={emoji}
          iconTelegramFileId={iconTelegramFileId}
          className="bg-hf-accent/8"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-hf-title-md text-hf-text-primary truncate">
            {name}
          </h4>
          <div className="mt-0.5 flex items-baseline gap-1 text-hf-body-sm">
            <span className="font-semibold text-hf-accent">{current}</span>
            <span className="text-hf-text-tertiary">/ {total} {unit}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlus}
          className="w-9 h-9 rounded-full bg-hf-accent/10 hover:bg-hf-accent/15 active:scale-[0.95] flex items-center justify-center text-hf-accent transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-hf-bg-secondary rounded-full h-1 mt-3.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            done ? 'bg-hf-success' : 'bg-hf-accent'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
