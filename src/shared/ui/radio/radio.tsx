
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface RadioProps<T> {
  value: T;
  groupValue: T | null | undefined;
  onChanged: (val: T) => void;
  label?: string;
  className?: string;
}

export const Radio = <T,>({
  value,
  groupValue,
  onChanged,
  label,
  className = '',
}: RadioProps<T>) => {
  const selected = value === groupValue;

  const handleClick = () => {
    hapticFeedback.impactOccurred.ifAvailable('light');
    onChanged(value);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2.5 cursor-pointer select-none ${className}`}
    >
      {/* Outer Circle */}
      <div
        className={`w-[22px] h-[22px] rounded-full transition-all duration-150 flex items-center justify-center ${
          selected ? 'border-2 border-tg-accent' : 'border-[1.5px] border-tg-hint/25'
        }`}
      >
        {/* Inner Circle (dot) */}
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-tg-accent" />
        )}
      </div>
      {label && <span className="text-[15px] text-tg-text leading-tight">{label}</span>}
    </div>
  );
};
