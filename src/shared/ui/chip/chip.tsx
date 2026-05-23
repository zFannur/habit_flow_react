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

  const containerStyles = `inline-flex items-center gap-[5px] px-3.5 py-1.5 rounded-hf-full border-[1.5px] transition-all duration-150 select-none ${
    selected
      ? 'bg-hf-accent/10 border-hf-accent text-hf-accent font-semibold'
      : 'bg-hf-card border-hf-border text-hf-text-secondary'
  }`;

  const clickableStyles = onTap ? 'cursor-pointer active:scale-95' : '';

  return (
    <div
      onClick={onTap ? handleClick : undefined}
      className={`${containerStyles} ${clickableStyles} ${className}`}
    >
      <span className="text-hf-body-sm leading-tight">{label}</span>
      {count !== undefined && (
        <span
          className={`inline-flex items-center justify-center px-[6px] py-[1px] rounded-hf-full text-hf-label-sm ${
            selected ? 'bg-hf-accent text-white' : 'bg-hf-bg-tertiary text-hf-text-tertiary'
          }`}
        >
          {count}
        </span>
      )}
    </div>
  );
};
