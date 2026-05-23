
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
          selected ? 'border-2 border-hf-accent' : 'border-[1.5px] border-hf-border'
        }`}
      >
        {selected && (
          <div className="w-[10px] h-[10px] rounded-full bg-hf-accent" />
        )}
      </div>
      {label && <span className="text-hf-body-md text-hf-text-primary">{label}</span>}
    </div>
  );
};
