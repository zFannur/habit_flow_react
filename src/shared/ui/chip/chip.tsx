import React from 'react';
import { hapticFeedback } from '@telegram-apps/sdk-react';

interface ChipProps {
  label: string;
  selected?: boolean;
  count?: number;
  onTap?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  count,
  onTap,
  className = '',
}) => {
  const handleClick = () => {
    if (onTap) {
      hapticFeedback.impactOccurred.ifAvailable('light');
      onTap();
    }
  };

  const containerStyles = `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] transition-all duration-150 select-none ${
    selected
      ? 'bg-tg-accent/10 border-tg-accent text-tg-accent font-semibold'
      : 'bg-tg-bg border-tg-hint/15 text-tg-hint'
  }`;

  const clickableStyles = onTap ? 'cursor-pointer active:scale-95' : '';

  return (
    <div
      onClick={onTap ? handleClick : undefined}
      className={`${containerStyles} ${clickableStyles} ${className}`}
    >
      <span className="text-[13px] leading-tight">{label}</span>
      {count !== undefined && (
        <span
          className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            selected ? 'bg-tg-accent text-white' : 'bg-tg-secondary-bg text-tg-hint'
          }`}
        >
          {count}
        </span>
      )}
    </div>
  );
};
